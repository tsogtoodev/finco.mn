<script setup lang="ts">
// Generic horizontal carousel (Figma 1:14210 / 1:14341): scroll-snap track of
// slides (default slot) + prev/next IconButtons + a scrollbar-thumb progress bar.
// Supports keyboard (←/→ when focused), drag-to-scroll and reduced motion.
const props = withDefaults(
  defineProps<{ tone?: 'dark' | 'light'; label?: string }>(),
  { tone: 'light' },
)

const scroller = ref<HTMLElement | null>(null)
const thumbWidth = ref(40)
const thumbLeft = ref(0)
const atStart = ref(true)
const atEnd = ref(false)

function update() {
  const el = scroller.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  thumbWidth.value = Math.min(100, (el.clientWidth / el.scrollWidth) * 100)
  const progress = max > 0 ? el.scrollLeft / max : 0
  thumbLeft.value = progress * (100 - thumbWidth.value)
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= max - 1
}

function reduced() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function page(dir: 1 | -1) {
  const el = scroller.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced() ? 'auto' : 'smooth' })
}

// Drag-to-scroll
let dragging = false
let startX = 0
let startScroll = 0
let moved = false

function onPointerDown(e: PointerEvent) {
  const el = scroller.value
  if (!el) return
  dragging = true
  moved = false
  startX = e.clientX
  startScroll = el.scrollLeft
}
function onPointerMove(e: PointerEvent) {
  const el = scroller.value
  if (!dragging || !el) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 4) moved = true
  el.scrollLeft = startScroll - dx
}
function onPointerUp() {
  dragging = false
}
// Suppress click after a drag so cards don't navigate on drag-release.
function onClickCapture(e: MouseEvent) {
  if (moved) {
    e.preventDefault()
    e.stopPropagation()
    moved = false
  }
}

onMounted(() => {
  update()
  scroller.value?.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  scroller.value?.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<template>
  <div>
    <div
      ref="scroller"
      role="group"
      :aria-label="props.label"
      tabindex="0"
      class="flex gap-6 overflow-x-auto scroll-smooth pb-2 outline-none [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      :class="dragging ? 'cursor-grabbing select-none' : 'cursor-grab'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @click.capture="onClickCapture"
      @keydown.left.prevent="page(-1)"
      @keydown.right.prevent="page(1)"
    >
      <slot />
    </div>

    <div class="mt-8 flex items-center gap-8">
      <div class="flex shrink-0 gap-6">
        <IconButton :tone="tone" direction="prev" :disabled="atStart" :label="$t('common.prev')" @click="page(-1)" />
        <IconButton :tone="tone" direction="next" :disabled="atEnd" :label="$t('common.next')" @click="page(1)" />
      </div>
      <div
        class="relative h-0.5 flex-1 rounded-full"
        :class="tone === 'dark' ? 'bg-white/15' : 'bg-black/10'"
      >
        <div
          class="absolute inset-y-0 rounded-full bg-teal transition-[left,width] duration-150"
          :style="{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }"
        />
      </div>
    </div>
  </div>
</template>
