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
const CARD_W_MAX = 408 // design width; the card never grows past it
const CARD_H = 420
// Smallest sliver of the next card left visible at the right edge, so the track
// still reads as scrollable once the active card has been shrunk to fit.
const PEEK_MIN = 24

// Viewport metrics behind the travel bounds and the peeks (set by `measure()`).
const rootW = ref(0)
const edgePad = ref(0)

// The design's 408px card is wider than a phone: at 375 the edge pad is 24, so a
// fixed card ran x = 24 -> 432 inside a 375px `overflow-hidden` root and ~57px of
// EVERY card was clipped — cropped image, excerpt cut mid-word — permanently, at
// every index. Unlike the products carousel there is no size ramp to recover it.
// Card HEIGHT stays fixed: the title is `truncate` and the excerpt `line-clamp-3`,
// so the text block is the same height at any width and nothing reflows.
const cardW = computed(() => {
  if (!rootW.value) return CARD_W_MAX // SSR / pre-measure: keep the design width
  return Math.min(CARD_W_MAX, Math.max(240, rootW.value - edgePad.value - PEEK_MIN))
})

const active = ref(0)
// Snap back to the first card whenever the list changes (locale switch).
watch(() => props.items.map((n) => n.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.items.length)
const atStart = computed(() => active.value <= 0)

// Right edge of the last card when `a` is active, measured from the track's
// left edge. Strictly decreasing in `a` (each step drops one card).
const rightExtent = (a: number) => {
  const visible = count.value - a
  return edgePad.value + visible * cardW.value + (visible - 1) * GAP
}
// Travel stops at the first index where every remaining card fits on screen —
// stepping past it would only pull dead space in on the right.
const maxActive = computed(() => {
  const last = Math.max(0, count.value - 1)
  if (!rootW.value) return last // pre-measure: keep the plain index behaviour
  for (let a = 0; a <= last; a++) {
    if (rightExtent(a) <= rootW.value) return a
  }
  return last
})
// A widening viewport can pull the bound below the current index.
watch(maxActive, (m) => { if (active.value > m) active.value = m })

const atEnd = computed(() => active.value >= maxActive.value)
const clamp = (n: number) => Math.min(Math.max(n, 0), maxActive.value)
function go(dir: 1 | -1) {
  active.value = clamp(active.value + dir)
  startAuto() // restart the countdown so it never steps right after a manual one
}

// Auto-advance: step forward every 5s, wrapping back to the first card at the
// end (`go` clamps, so the wrap is done here rather than through it). It only
// runs while the carousel is actually on screen (`onScreen`, driven by
// autoObserver below) so it never burns cycles — or silently skips past cards —
// while parked elsewhere on the page. Hover pauses so a card can be read, a
// backgrounded tab suspends it, and any manual step restarts the countdown.
// Skipped for prefers-reduced-motion — an unprompted 600ms slide is exactly the
// motion that setting opts out of.
const AUTO_MS = 5000
let autoTimer: ReturnType<typeof setInterval> | null = null
let autoObserver: IntersectionObserver | null = null
let hovering = false
let onScreen = false

function advance() {
  active.value = active.value >= maxActive.value ? 0 : active.value + 1
}
function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}
function startAuto() {
  stopAuto()
  // maxActive 0 = every card already fits; there is nothing to advance to.
  if (!onScreen || hovering || maxActive.value <= 0) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  autoTimer = setInterval(advance, AUTO_MS)
}
function onEnter() {
  hovering = true
  stopAuto()
}
function onLeave() {
  hovering = false
  startAuto()
}
function onVisibility() {
  if (document.hidden) stopAuto()
  else startAuto()
}

// Shift the track left so the active card's leading edge lands on the main slot
// (the track's padding-left = --carousel-edge places that slot).
const trackOffset = computed(() => -active.value * (cardW.value + GAP))

// Pointer drag with deferred capture: a press alone does nothing — we only
// engage drag (and capture the pointer, disabling the snap transition) once the
// finger crosses DRAG_THRESHOLD. So a tap never becomes a drag and flows through
// as a normal click that navigates the card link; only a real drag suppresses
// that trailing click and steps by however many card-widths were dragged.
const DRAG_THRESHOLD = 8
const step = () => cardW.value + GAP // one card width
const dragging = ref(false) // past threshold: track follows the finger
const dragX = ref(0)
let pressing = false // pointer down, not yet (maybe never) a drag
let suppressClick = false // last gesture was a drag → cancel its click
let startX = 0
let pointerId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  stopAuto()
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
  if (!wasDragging) {
    startAuto() // a tap — let the click navigate the card
    return
  }
  suppressClick = true // a drag — cancel the click that follows
  const steps = Math.round(-dx / step())
  if (steps !== 0) active.value = clamp(active.value + steps)
  else if (Math.abs(dx) > 60) active.value = clamp(active.value + (dx < 0 ? 1 : -1))
  startAuto()
}
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.preventDefault()
    e.stopPropagation()
    suppressClick = false
  }
}

const progress = computed(() => (maxActive.value <= 0 ? 1 : active.value / maxActive.value))

// Peeks/floating nav only make sense while cards are actually cut off at that
// edge — near the end the remaining cards may fit entirely on screen, and a
// frosted button would float over blank background. Extents are derived from
// the fixed card size (not the DOM) so mid-transition animation can't skew them.
const rootEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null
function measure() {
  if (!rootEl.value || !trackEl.value) return
  rootW.value = rootEl.value.clientWidth
  edgePad.value = Number.parseFloat(getComputedStyle(trackEl.value).paddingLeft) || 0
}
// Staggered card reveal (see .carousel-reveal in main.css): SSR/no-JS renders
// the cards visible; after hydration they hide (`hydrated`) until the carousel
// enters the viewport, then rise in one by one via inline animation-delay.
const hydrated = ref(false)
const revealed = ref(false)
let revealObserver: IntersectionObserver | null = null
const revealDelay = (i: number) => `${Math.min(i, 6) * 80}ms`

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (rootEl.value) resizeObserver.observe(rootEl.value)

  document.addEventListener('visibilitychange', onVisibility)

  if (!('IntersectionObserver' in window)) {
    revealed.value = true
    onScreen = true // no IO to gate on — fall back to always-on, never never-on
    startAuto()
    return
  }
  hydrated.value = true

  // Viewport gate for the auto-advance. Separate from revealObserver below,
  // which disconnects after the first reveal and so can't track leaving again.
  autoObserver = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]?.isIntersecting ?? false
    if (onScreen) startAuto()
    else stopAuto()
  }, { threshold: 0.2 })
  if (rootEl.value) autoObserver.observe(rootEl.value)
  revealObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      revealed.value = true
      revealObserver?.disconnect()
      revealObserver = null
    }
  }, { threshold: 0.15 })
  if (rootEl.value) revealObserver.observe(rootEl.value)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  revealObserver?.disconnect()
  autoObserver?.disconnect()
  stopAuto()
  document.removeEventListener('visibilitychange', onVisibility)
})

// Before mount (rootW=0) fall back to the plain index checks so SSR matches
// the common case.
const overflowsLeft = computed(() => {
  if (atStart.value) return false
  if (!rootW.value) return true
  return active.value * (cardW.value + GAP) > edgePad.value
})
// Cards overflow right exactly while the track can still travel — `maxActive`
// is defined as the first index where they stop overflowing.
const overflowsRight = computed(() => active.value < maxActive.value)

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
      @pointerenter="onEnter"
      @pointerleave="onLeave"
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
        ref="trackEl"
        class="flex h-[420px] items-start pl-[var(--carousel-edge,1.5rem)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="dragging ? '' : 'transition-transform duration-[600ms]'"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset + dragX}px)` }"
      >
        <NewsCard
          v-for="(n, i) in items"
          :key="n.slug"
          :title="n.title"
          :excerpt="n.excerpt"
          :image="n.image"
          :to="n.to"
          :style="{ width: `${cardW}px`, height: `${CARD_H}px`, animationDelay: revealed ? revealDelay(i) : undefined }"
          class="shrink-0 overflow-hidden"
          :class="revealed ? 'carousel-reveal' : hydrated ? 'carousel-pre' : ''"
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
