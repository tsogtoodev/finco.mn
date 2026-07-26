<script setup lang="ts">
// Reusable modal. `v-model:open` controls visibility. Teleports to <body>, shows
// a dimmed/blurred backdrop, centers a white rounded-24 card, closes on
// Esc / backdrop / × , locks body scroll, and restores focus to the opener.
//
// Animation lives in main.css (.t-modal / .t-backdrop, Transitions.dev modal).
// Enter: mount closed, force a reflow so the initial scale/opacity is
// committed, then add `.is-open` — the forced reflow (not rAF) is what keeps
// the transition from stranding on teleported nodes. Exit: swap `.is-open`
// for `.is-closing`, wait --modal-close-dur (150ms), then unmount.
const props = withDefaults(
  defineProps<{ open: boolean; title?: string; labelClose?: string; maxWidth?: string }>(),
  { labelClose: 'Close', maxWidth: '840px' },
)
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const CLOSE_DUR = 150 // keep in sync with --modal-close-dur

const visible = ref(false) // mounted in the DOM?
const opened = ref(false) // has `.is-open` (drives the enter transition)?
const closing = ref(false) // playing the exit animation?
const card = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null
// The body lock is reference-counted (see useScrollLock), so this instance must
// release exactly the one it took — never on an unmount where it held none.
let holdsLock = false

function close() { emit('update:open', false) }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close() }

watch(
  () => props.open,
  (isOpen) => {
    if (import.meta.server) return
    if (isOpen) {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
      closing.value = false
      lastFocused = document.activeElement as HTMLElement
      lockBodyScroll()
      holdsLock = true
      document.addEventListener('keydown', onKeydown)
      visible.value = true
      nextTick(() => {
        card.value?.focus()
        // Commit the closed state before flipping `.is-open` so the enter
        // transition always plays (see main.css).
        void card.value?.offsetWidth
        opened.value = true
      })
    }
    else {
      if (!visible.value) return
      opened.value = false
      closing.value = true
      document.removeEventListener('keydown', onKeydown)
      closeTimer = setTimeout(() => {
        visible.value = false
        closing.value = false
        unlockBodyScroll()
        holdsLock = false
        lastFocused?.focus?.()
      }, CLOSE_DUR)
    }
  },
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    if (holdsLock) { unlockBodyScroll(); holdsLock = false }
    document.removeEventListener('keydown', onKeydown)
    if (closeTimer) clearTimeout(closeTimer)
  }
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          class="t-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
          :class="{ 'is-closing': closing }"
          @click="close"
        />
        <!-- max-h uses dvh, not vh: on mobile `vh` resolves to the LARGE viewport
             (toolbars retracted), so 90vh ≈ 673px on a 667px-tall iPhone SE and
             the bottom of the card — the submit button — sat under the browser
             chrome. -->
        <div
          ref="card"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          class="t-modal relative z-[1] flex max-h-[90dvh] w-full flex-col rounded-[24px] bg-white p-6 shadow-2xl outline-none sm:p-8"
          :class="{ 'is-open': opened, 'is-closing': closing }"
          :style="{ maxWidth }"
        >
          <!-- The ✕ is absolute against the CARD, and the card no longer scrolls
               — only the body below does. Previously the card itself was the
               scroll container, so on mobile (where a form like FeedbackDialog
               always overflows) the close button scrolled off the top and the
               only way out was a backdrop tap, with Esc unavailable on touch. -->
          <button
            type="button"
            :aria-label="labelClose"
            class="dialog-close absolute right-4 top-4 z-[2] grid size-10 place-items-center rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-300"
            @click="close"
          >
            <Icon name="f:remove" class="text-[24px] text-foreground/70" />
          </button>
          <h2 v-if="title" class="mb-8 shrink-0 text-center font-display text-2xl font-semibold text-foreground">
            {{ title }}
          </h2>
          <!-- min-h-0 is load-bearing: a flex child defaults to min-height:auto,
               which refuses to shrink below its content, so the scroller would
               never engage and the card would grow past max-h instead. -->
          <!-- data-lenis-prevent keeps the smooth-scroll layer off this scroller
               (it gets overscroll-behavior: contain from lenis.css too, so a
               wheel past its end doesn't leak to the page behind). -->
          <div data-lenis-prevent class="min-h-0 flex-1 overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
/* Press micro-interaction: subtle blur + scale with a fast-out deceleration curve. */
.dialog-close {
  transition:
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1),
    filter 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.dialog-close:active {
  transform: scale(0.88);
  /* filter: blur(1px); */
}
</style>
