<script setup lang="ts">
// Home product carousel — a "spotlight" carousel (Figma 238:9718). The active
// ("main") card is the largest and is pinned to the first-item slot; every other
// card shrinks with its distance from the active one, so it reads as a descending
// staircase on BOTH sides. Prev/next step exactly one card at a time.
const props = defineProps<{
  products: { slug: string; title: string; summary: string; image: string }[]
  label?: string
}>()
const { t } = useI18n()

const GAP = 51
// Symmetric size fall-off from the active card (distance 0 = biggest).
const cardW = (d: number) => Math.max(293, 353 - d * 15)
const cardH = (d: number) => Math.max(390, 470 - d * 20)

const active = ref(0)
// Snap back to the first card whenever the list changes (audience toggle).
watch(() => props.products.map((p) => p.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.products.length)
const atStart = computed(() => active.value <= 0)
const atEnd = computed(() => active.value >= count.value - 1)
const clamp = (n: number) => Math.min(Math.max(n, 0), count.value - 1)
function go(dir: 1 | -1) {
  active.value = clamp(active.value + dir)
}

// Pointer drag with deferred capture: a press alone does nothing — we only
// engage drag (and capture the pointer, disabling the snap transition) once the
// finger crosses DRAG_THRESHOLD. So a tap never becomes a drag and flows through
// as a normal click that navigates the card link; only a real drag suppresses
// that trailing click and steps by however many card-widths were dragged.
const DRAG_THRESHOLD = 8
const STEP = cardW(0) + GAP // one active-card width
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

// Shift the track left so the active card's leading edge lands on the main slot
// (the track's padding-left = --carousel-edge places that slot).
const trackOffset = computed(() => {
  let x = 0
  for (let k = 0; k < active.value; k++) x += cardW(active.value - k) + GAP
  return -x
})

const progress = computed(() => (count.value <= 1 ? 1 : active.value / (count.value - 1)))

// Peeks/floating nav only make sense while cards are actually cut off at that
// edge — e.g. near the end the remaining cards may fit entirely on screen, and
// a frosted button would float over blank background. Extents are derived from
// the size model (not the DOM) so mid-transition animation can't skew them.
const rootEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
const rootW = ref(0)
const edgePad = ref(0)
let resizeObserver: ResizeObserver | null = null
function measure() {
  if (!rootEl.value || !trackEl.value) return
  rootW.value = rootEl.value.clientWidth
  edgePad.value = Number.parseFloat(getComputedStyle(trackEl.value).paddingLeft) || 0
}
onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (rootEl.value) resizeObserver.observe(rootEl.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

// Cards before the active one hang left of the main slot; overflow when they
// reach past the viewport's left edge. Before mount (rootW=0) fall back to the
// plain index checks so SSR matches the common case.
const overflowsLeft = computed(() => {
  if (atStart.value) return false
  if (!rootW.value) return true
  let w = 0
  for (let d = 1; d <= active.value; d++) w += cardW(d) + GAP
  return w > edgePad.value
})
const overflowsRight = computed(() => {
  if (atEnd.value) return false
  if (!rootW.value) return true
  let x = edgePad.value
  for (let i = active.value; i < count.value; i++) x += cardW(i - active.value) + (i < count.value - 1 ? GAP : 0)
  return x > rootW.value
})

const MASK_R = 'linear-gradient(to right, transparent, #000 60%)'
const MASK_L = 'linear-gradient(to left, transparent, #000 60%)'
</script>

<template>
  <div>
    <div
      ref="rootEl"
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
      <!-- Height pinned to the tallest (active) card. Without this the row height
           follows the animating card sizes and dips below 470 mid-step — springing
           back and bouncing the whole centred row. Cards just centre within it. -->
      <div
        ref="trackEl"
        class="flex h-[470px] items-center pl-[var(--carousel-edge,1.5rem)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="dragging ? '' : 'transition-transform duration-[600ms]'"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset + dragX}px)` }"
      >
        <ProductCard
          v-for="(p, i) in products"
          :key="p.slug"
          :title="p.title"
          :summary="p.summary"
          :image="p.image"
          :to="`/products/${p.slug}`"
          :style="{ width: `${cardW(Math.abs(i - active))}px`, height: `${cardH(Math.abs(i - active))}px`, minHeight: 0 }"
          class="shrink-0 transition-[width,height] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
      </div>

      <!-- Blurred peeks — previous cards on the left, upcoming on the right. -->
      <div
        v-show="overflowsLeft"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_L, WebkitMaskImage: MASK_L }"
      />
      <div
        v-show="overflowsRight"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_R, WebkitMaskImage: MASK_R }"
      />

      <!-- Floating nav on the blurred peeks (Figma 238:9754): a frosted arrow
           button centred over each peek. Wrapper handles position + show/hide so
           IconButton stays untouched; pointer-events only on the 44px circle so
           the rest of the peek still accepts drag. `.stop` keeps a button press
           from also starting a track drag. -->
      <div
        v-show="overflowsLeft"
        class="pointer-events-none absolute left-[38px] top-1/2 z-10 hidden -translate-y-1/2 md:block lg:left-[56px]"
      >
        <IconButton tone="dark" direction="prev" :label="t('common.prev')" class="pointer-events-auto border border-white/40 backdrop-blur-[20px]" @click="go(-1)" @pointerdown.stop />
      </div>
      <div
        v-show="overflowsRight"
        class="pointer-events-none absolute right-[38px] top-1/2 z-10 hidden -translate-y-1/2 md:block lg:right-[56px]"
      >
        <IconButton tone="dark" direction="next" :label="t('common.next')" class="pointer-events-auto border border-white/40 backdrop-blur-[20px]" @click="go(1)" @pointerdown.stop />
      </div>
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
