<script setup lang="ts">
const props = withDefaults(
  defineProps<{ open: boolean; title?: string; labelClose?: string; maxWidth?: string }>(),
  { labelClose: 'Close', maxWidth: '840px' },
)
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const CLOSE_DUR = 150

const visible = ref(false)
const opened = ref(false)
const closing = ref(false)
const card = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null
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
          <div data-lenis-prevent class="min-h-0 flex-1 overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.dialog-close {
  transition:
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1),
    filter 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.dialog-close:active {
  transform: scale(0.88);
}
</style>
