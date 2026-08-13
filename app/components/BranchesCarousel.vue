<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{
  branches: Collections['branches'][]
  label?: string
}>()
const { t } = useI18n()

const GAP = 32
const CARD_W_MAX = 400
const PEEK_MIN = 24

const rootW = ref(0)
const edgePad = ref(0)

const cardW = computed(() => {
  if (!rootW.value) return CARD_W_MAX
  return Math.min(CARD_W_MAX, Math.max(240, rootW.value - edgePad.value - PEEK_MIN))
})

const active = ref(0)
watch(() => props.branches.map((b) => b.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.branches.length)
const atStart = computed(() => active.value <= 0)

const rightExtent = (a: number) => {
  const visible = count.value - a
  return edgePad.value + visible * cardW.value + (visible - 1) * GAP
}
const maxActive = computed(() => {
  const last = Math.max(0, count.value - 1)
  if (!rootW.value) return last
  for (let a = 0; a <= last; a++) {
    if (rightExtent(a) <= rootW.value) return a
  }
  return last
})
watch(maxActive, (m) => { if (active.value > m) active.value = m })

const atEnd = computed(() => active.value >= maxActive.value)
const clamp = (n: number) => Math.min(Math.max(n, 0), maxActive.value)
function go(dir: 1 | -1) {
  active.value = clamp(active.value + dir)
  startAuto()
}

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

const trackOffset = computed(() => -active.value * (cardW.value + GAP))

const DRAG_THRESHOLD = 8
const step = () => cardW.value + GAP
const dragging = ref(false)
const dragX = ref(0)
let pressing = false
let suppressClick = false
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
    if (Math.abs(dx) < DRAG_THRESHOLD) return
    dragging.value = true
    if (pointerId != null) {
      try { (e.currentTarget as HTMLElement).setPointerCapture(pointerId) } catch {}
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
    try { (e.currentTarget as HTMLElement).releasePointerCapture(pointerId) } catch {}
    pointerId = null
  }
  if (!wasDragging) {
    startAuto()
    return
  }
  suppressClick = true
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

const rootEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null
function measure() {
  if (!rootEl.value || !trackEl.value) return
  rootW.value = rootEl.value.clientWidth
  edgePad.value = Number.parseFloat(getComputedStyle(trackEl.value).paddingLeft) || 0
}
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
    onScreen = true
    startAuto()
    return
  }
  hydrated.value = true

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

const overflowsLeft = computed(() => {
  if (atStart.value) return false
  if (!rootW.value) return true
  return active.value * (cardW.value + GAP) > edgePad.value
})
const overflowsRight = computed(() => active.value < maxActive.value)

const MASK_R = 'linear-gradient(to right, transparent 26%, #000 80%)'
const MASK_L = 'linear-gradient(to left, transparent 26%, #000 80%)'
</script>

<template>
  <div>
    <div
      ref="rootEl"
      class="relative touch-pan-y overflow-hidden select-none"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      role="group"
      :aria-label="label ?? t('branchesPage.carouselLabel')"
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
      <div
        ref="trackEl"
        class="flex items-stretch py-6 pl-[var(--carousel-edge,1.5rem)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="dragging ? '' : 'transition-transform duration-[600ms]'"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset + dragX}px)` }"
      >
        <BranchCard
          v-for="(b, i) in branches"
          :key="b.slug"
          :branch="b"
          :style="{ width: `${cardW}px`, animationDelay: revealed ? revealDelay(i) : undefined }"
          class="shrink-0"
          :class="revealed ? 'carousel-reveal' : hydrated ? 'carousel-pre' : ''"
        />
      </div>

      <div
        v-show="overflowsLeft"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 hidden w-[200px] backdrop-blur-[6px] md:block lg:w-[404px]"
        :style="{ maskImage: MASK_L, WebkitMaskImage: MASK_L }"
      />
      <div
        v-show="overflowsRight"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 hidden w-[200px] backdrop-blur-[6px] md:block lg:w-[404px]"
        :style="{ maskImage: MASK_R, WebkitMaskImage: MASK_R }"
      />

      <div
        v-show="overflowsLeft"
        class="pointer-events-none absolute left-[max(0.5rem,calc(var(--carousel-edge,1.5rem)-22px))] top-1/2 z-10 hidden -translate-y-1/2 md:block"
      >
        <IconButton tone="light" direction="prev" :label="t('common.prev')" class="pointer-events-auto border border-white/40 backdrop-blur-[20px]" @click="go(-1)" @pointerdown.stop />
      </div>
      <div
        v-show="overflowsRight"
        class="pointer-events-none absolute right-[max(0.5rem,calc(var(--carousel-edge,1.5rem)-22px))] top-1/2 z-10 hidden -translate-y-1/2 md:block"
      >
        <IconButton tone="light" direction="next" :label="t('common.next')" class="pointer-events-auto border border-white/40 backdrop-blur-[20px]" @click="go(1)" @pointerdown.stop />
      </div>
    </div>

    <div class="mt-10 flex items-center gap-20 px-[var(--carousel-edge,1.5rem)]">
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
