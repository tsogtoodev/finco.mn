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
      document.body.style.overflow = 'hidden'
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
        document.body.style.overflow = ''
        lastFocused?.focus?.()
      }, CLOSE_DUR)
    }
  },
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
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
        <div
          ref="card"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          class="t-modal relative z-[1] max-h-[90vh] w-full overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl outline-none sm:p-8"
          :class="{ 'is-open': opened, 'is-closing': closing }"
          :style="{ maxWidth }"
        >
          <button
            type="button"
            :aria-label="labelClose"
            class="dialog-close absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-300"
            @click="close"
          >
            <Icon name="f:remove" class="text-[24px] text-foreground/70" />
          </button>
          <h2 v-if="title" class="mb-8 text-center font-display text-2xl font-semibold text-foreground">
            {{ title }}
          </h2>
          <slot />
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
