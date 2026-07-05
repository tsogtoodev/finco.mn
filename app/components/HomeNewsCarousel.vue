<script setup lang="ts">
// Home news carousel — full-bleed carousel of uniform-width cards that steps one
// at a time; the active card is pinned to the first-item slot with blurred peeks
// on either side. (Mirrors HomeProductsCarousel's layout/interaction, without the
// size ramp — every card is the same size.)
const props = defineProps<{
  items: { slug: string; title: string; excerpt?: string; image?: string; to?: string }[]
  label?: string
}>()
const { t } = useI18n()

const GAP = 40
const CARD_W = 408
const CARD_H = 420

const active = ref(0)
// Snap back to the first card whenever the list changes (locale switch).
watch(() => props.items.map((n) => n.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.items.length)
const atStart = computed(() => active.value <= 0)
const atEnd = computed(() => active.value >= count.value - 1)
const clamp = (n: number) => Math.min(Math.max(n, 0), count.value - 1)
function go(dir: 1 | -1) {
  active.value = clamp(active.value + dir)
}

// Shift the track left so the active card's leading edge lands on the main slot
// (the track's padding-left = --carousel-edge places that slot).
const trackOffset = computed(() => -active.value * (CARD_W + GAP))

// Pointer drag with deferred capture: a press alone does nothing — we only
// engage drag (and capture the pointer, disabling the snap transition) once the
// finger crosses DRAG_THRESHOLD. So a tap never becomes a drag and flows through
// as a normal click that navigates the card link; only a real drag suppresses
// that trailing click and steps by however many card-widths were dragged.
const DRAG_THRESHOLD = 8
const STEP = CARD_W + GAP // one card width
const dragging = ref(false) // past threshold: track follows the finger
const dragX = ref(0)
let pressing = false // pointer down, not yet (maybe never) a drag
let suppressClick = false // last gesture was a drag → cancel its click
let startX = 0
let pointerId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pressing = true
  dragging.value = false
  dragX.value = 0
  startX = e.clientX
  pointerId = e.pointerId
}
function onPointerMove(e: PointerEvent) {
  if (!pressing) return
  const dx = e.clientX - startX
  if (!dragging.value) {
    if (Math.abs(dx) < DRAG_THRESHOLD) return // still within tap tolerance
    dragging.value = true
    if (pointerId != null) {
      try { (e.currentTarget as HTMLElement).setPointerCapture(pointerId) } catch { /* synthetic/invalid pointer */ }
    }
  }
  dragX.value = dx
}
function onPointerUp(e: PointerEvent) {
  if (!pressing) return
  pressing = false
  const wasDragging = dragging.value
  const dx = dragX.value
  dragging.value = false
  dragX.value = 0
  if (pointerId != null) {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(pointerId) } catch { /* not captured */ }
    pointerId = null
  }
  if (!wasDragging) return // a tap — let the click navigate the card
  suppressClick = true // a drag — cancel the click that follows
  const steps = Math.round(-dx / STEP)
  if (steps !== 0) active.value = clamp(active.value + steps)
  else if (Math.abs(dx) > 60) active.value = clamp(active.value + (dx < 0 ? 1 : -1))
}
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.preventDefault()
    e.stopPropagation()
    suppressClick = false
  }
}

const progress = computed(() => (count.value <= 1 ? 1 : active.value / (count.value - 1)))

const MASK_R = 'linear-gradient(to right, transparent, #000 60%)'
const MASK_L = 'linear-gradient(to left, transparent, #000 60%)'
</script>

<template>
  <div>
    <div
      class="relative touch-pan-y overflow-hidden select-none"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      role="group"
      :aria-label="label"
      tabindex="0"
      @keydown.left.prevent="go(-1)"
      @keydown.right.prevent="go(1)"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click.capture="onClickCapture"
      @dragstart.prevent
    >
      <!-- Fixed card height keeps the row uniform (news text lengths vary);
           overflow-hidden clips any overflow. -->
      <div
        class="flex h-[420px] items-start pl-[var(--carousel-edge,1.5rem)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="dragging ? '' : 'transition-transform duration-[600ms]'"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset + dragX}px)` }"
      >
        <NewsCard
          v-for="n in items"
          :key="n.slug"
          :title="n.title"
          :excerpt="n.excerpt"
          :image="n.image"
          :to="n.to"
          :style="{ width: `${CARD_W}px`, height: `${CARD_H}px` }"
          class="shrink-0 overflow-hidden"
        />
      </div>

      <!-- Blurred peeks — previous cards on the left, upcoming on the right. -->
      <div
        v-show="!atStart"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_L, WebkitMaskImage: MASK_L }"
      />
      <div
        v-show="!atEnd"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_R, WebkitMaskImage: MASK_R }"
      />
    </div>

    <!-- Controls (stay aligned to the heading column) -->
    <div class="mt-8 flex items-center gap-8 px-[var(--carousel-edge,1.5rem)]">
      <div class="flex shrink-0 gap-6">
        <IconButton tone="light" direction="prev" :disabled="atStart" :label="t('common.prev')" @click="go(-1)" />
        <IconButton tone="light" direction="next" :disabled="atEnd" :label="t('common.next')" @click="go(1)" />
      </div>
      <div class="relative h-0.5 flex-1 rounded-full bg-black/10">
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-teal transition-[width] duration-300"
          :style="{ width: `${progress * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
