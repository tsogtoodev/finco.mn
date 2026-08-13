<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { afterLcp } from '~/utils/afterLcp'
import { getSmoothScroll } from '~/utils/smoothScroll'
import {
  SPLINE_MAX_FPS,
  SPLINE_MAX_PIXEL_RATIO,
  type SplineParticipant,
  rebalanceSplineScenes,
  registerSplineScene,
  unregisterSplineScene,
} from '~/utils/splineQuality'

const props = withDefaults(
  defineProps<{
    scene: string
    rootMargin?: number
    maxPixelRatio?: number
    maxFps?: number
    noHover?: boolean
    noDrag?: boolean
    revealDelay?: number
    zoom?: number
    occludedBy?: string
    preload?: boolean
    deferUntilLcp?: boolean
  }>(),
  {
    rootMargin: 200,
    noDrag: false,
    revealDelay: 0,
    zoom: 1,
    preload: false,
    maxPixelRatio: SPLINE_MAX_PIXEL_RATIO,
    maxFps: SPLINE_MAX_FPS,
    noHover: false,
    deferUntilLcp: false,
  },
)

const emit = defineEmits<{ load: [] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
const revealed = ref(false)
let revealTimer: ReturnType<typeof setTimeout> | null = null
const app = shallowRef<import('@splinetool/runtime').Application | null>(null)

function inView() {
  const el = canvas.value
  if (!el) return false
  const r = el.getBoundingClientRect()
  const m = props.rootMargin
  return r.width > 0 && r.top < window.innerHeight + m && r.bottom > -m
}

function teardownScroll() {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
}

function onScroll() {
  if (inView()) {
    teardownScroll()
    loadScene()
  }
}

let loadStarted = false
let unmounted = false

async function loadScene() {
  if (loadStarted || !canvas.value) return
  loadStarted = true
  teardownScroll()
  try {
    if (props.deferUntilLcp) await afterLcp()
    if (unmounted || !canvas.value) return
    const { Application } = await import('@splinetool/runtime')
    if (unmounted || !canvas.value) return
    app.value = new Application(canvas.value)
    await app.value.load(props.scene)
    if (unmounted || !app.value) return
    if (props.zoom !== 1) app.value.setZoom(props.zoom)
    applyPixelRatio()
    relaxRuntimeScrollListeners()
    if (props.noHover) detachHoverRaycast()
    loaded.value = true
    if (props.revealDelay > 0) revealTimer = setTimeout(() => { revealed.value = true }, props.revealDelay)
    else revealed.value = true
    startRenderGating()
    emit('load')
  }
  catch (err) {
    console.error('[SplineScene] failed to load', err)
  }
}

async function schedulePrefetch() {
  if (loadStarted || typeof window === 'undefined') return
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn?.saveData || /(?:^|-)2g$/.test(conn?.effectiveType ?? '')) return

  const warm = () => {
    if (loadStarted || unmounted) return
    if (!canvas.value || canvas.value.getBoundingClientRect().width === 0) return
    if (props.preload) {
      loadScene()
      return
    }
    import('@splinetool/runtime').catch(() => {})
    fetch(props.scene).catch(() => {})
  }
  if (props.deferUntilLcp) {
    await afterLcp()
    if (unmounted) return
  }
  if (props.preload) warm()
  else if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 })
  else setTimeout(warm, 1500)
}

let io: IntersectionObserver | null = null
let renderActive: boolean | null = null

type RuntimeInternals = {
  _renderer?: {
    setAnimationLoop: (fn: ((t: number) => void) | null) => void
    setPixelRatio?: (v: number) => void
    getPixelRatio?: () => number
  }
  _lastTime?: number
  render?: (t: number) => void
  _resize?: (force?: boolean) => void
  _onScroll?: EventListener
  _eventManager?: { onScroll?: EventListener; onMouseMove?: EventListener }
}

function applyPixelRatio() {
  const a = app.value
  if (!a) return
  const g = a as unknown as RuntimeInternals
  const r = g._renderer
  if (!r?.setPixelRatio) return
  const target = Math.min(window.devicePixelRatio || 1, Math.max(0.25, props.maxPixelRatio))
  if (r.getPixelRatio && Math.abs(r.getPixelRatio() - target) < 0.001) return
  r.setPixelRatio(target)
  g._resize?.(true)
}

function relaxRuntimeScrollListeners() {
  const g = app.value as unknown as RuntimeInternals | null
  if (!g) return
  const docHandler = g._onScroll
  if (typeof docHandler === 'function') {
    document.removeEventListener('scroll', docHandler)
    document.addEventListener('scroll', docHandler, { passive: true })
  }
  const emHandler = g._eventManager?.onScroll
  if (typeof emHandler === 'function') {
    window.removeEventListener('scroll', emHandler)
    window.addEventListener('scroll', emHandler, { passive: true })
  }
}

function detachHoverRaycast() {
  const handler = (app.value as unknown as RuntimeInternals | null)?._eventManager?.onMouseMove
  if (typeof handler !== 'function') return
  window.removeEventListener('pointermove', handler)
  document.removeEventListener('pointermove', handler)
}

const participant: SplineParticipant = {
  ratio: 0,
  setRendering: (on: boolean) => setRenderLoop(on),
}

let ioRatio = 0
let occluded = false

function syncParticipantRatio() {
  const next = occluded ? 0 : ioRatio
  if (next === participant.ratio) return
  participant.ratio = next
  rebalanceSplineScenes()
}

let occlusionBound = false
let occlusionFrame: number | null = null

function measureOcclusion() {
  occlusionFrame = null
  const el = canvas.value
  const cover = props.occludedBy ? document.querySelector(props.occludedBy) : null
  if (!el || !cover) {
    occluded = false
    syncParticipantRatio()
    return
  }
  const c = el.getBoundingClientRect()
  const r = cover.getBoundingClientRect()
  const top = Math.max(c.top, 0)
  const bottom = Math.min(c.bottom, window.innerHeight)
  const left = Math.max(c.left, 0)
  const right = Math.min(c.right, window.innerWidth)
  occluded = bottom > top
    && right > left
    && r.left <= left && r.right >= right
    && r.top <= top
  syncParticipantRatio()
}

function onOcclusionScroll() {
  if (occlusionFrame !== null) return
  occlusionFrame = requestAnimationFrame(measureOcclusion)
}

function bindOcclusion() {
  if (occlusionBound) return
  occlusionBound = true
  window.addEventListener('scroll', onOcclusionScroll, { passive: true })
  window.addEventListener('resize', onOcclusionScroll, { passive: true })
}

function unbindOcclusion() {
  if (!occlusionBound) return
  occlusionBound = false
  window.removeEventListener('scroll', onOcclusionScroll)
  window.removeEventListener('resize', onOcclusionScroll)
  if (occlusionFrame !== null) {
    cancelAnimationFrame(occlusionFrame)
    occlusionFrame = null
  }
}

function refreshOcclusion() {
  if (!props.occludedBy || ioRatio === 0) {
    unbindOcclusion()
    occluded = false
    syncParticipantRatio()
    return
  }
  bindOcclusion()
  measureOcclusion()
}

let lastFrameAt = 0
function throttledFrame(t: number) {
  const g = app.value as unknown as RuntimeInternals | null
  if (!g?.render) return
  const interval = props.maxFps > 0 ? 1000 / props.maxFps : 0
  if (interval && lastFrameAt && t - lastFrameAt < interval - 1) return
  lastFrameAt = t
  g.render(t)
}

function setRenderLoop(active: boolean) {
  const a = app.value
  if (!a) return
  if (active === renderActive) return
  renderActive = active
  const g = a as unknown as RuntimeInternals
  if (g._renderer?.setAnimationLoop && typeof g.render === 'function') {
    if (active) {
      g._lastTime = 0
      lastFrameAt = 0
      g._renderer.setAnimationLoop(throttledFrame)
    }
    else {
      g._renderer.setAnimationLoop(null)
    }
  }
  else {
    if (active && a.isStopped) a.play()
    else if (!active && !a.isStopped) a.stop()
  }
}

function startRenderGating() {
  if (!app.value) return
  registerSplineScene(participant)
  if (typeof IntersectionObserver !== 'undefined' && canvas.value) {
    io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1]
      if (!last) return
      ioRatio = last.isIntersecting ? Math.max(last.intersectionRatio, 0.0001) : 0
      refreshOcclusion()
    }, { threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] })
    io.observe(canvas.value)
  }
  else {
    ioRatio = 1
    refreshOcclusion()
  }
}

function stopRenderGating() {
  io?.disconnect()
  io = null
  unbindOcclusion()
  unregisterSplineScene(participant)
}

let pressedOnCanvas = false

function isOverCanvas(e: Event) {
  return !!canvas.value && e.target === canvas.value
}
function onPressStart(e: PointerEvent | TouchEvent) {
  const target = 'touches' in e ? e.touches[0]?.target : e.target
  pressedOnCanvas = !!canvas.value && target === canvas.value
}
function onMove(e: Event) {
  if (pressedOnCanvas) e.stopPropagation()
}
function onPressEnd() {
  pressedOnCanvas = false
}

function bindMotionGuard() {
  window.addEventListener('pointerdown', onPressStart, true)
  window.addEventListener('pointermove', onMove, true)
  window.addEventListener('mousemove', onMove, true)
  window.addEventListener('pointerup', onPressEnd, true)
  window.addEventListener('pointercancel', onPressEnd, true)
  window.addEventListener('touchstart', onPressStart, true)
  window.addEventListener('touchmove', onMove, true)
  window.addEventListener('touchend', onPressEnd, true)
}
function unbindMotionGuard() {
  window.removeEventListener('pointerdown', onPressStart, true)
  window.removeEventListener('pointermove', onMove, true)
  window.removeEventListener('mousemove', onMove, true)
  window.removeEventListener('pointerup', onPressEnd, true)
  window.removeEventListener('pointercancel', onPressEnd, true)
  window.removeEventListener('touchstart', onPressStart, true)
  window.removeEventListener('touchmove', onMove, true)
  window.removeEventListener('touchend', onPressEnd, true)
}

let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null
let ownsWheel = false

function forwardWheelToPage(e: WheelEvent) {
  window.dispatchEvent(new WheelEvent('wheel', {
    deltaX: e.deltaX,
    deltaY: e.deltaY,
    deltaZ: e.deltaZ,
    deltaMode: e.deltaMode,
    clientX: e.clientX,
    clientY: e.clientY,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    bubbles: false,
    cancelable: true,
  }))
}

function onWheelGuard(e: WheelEvent) {
  const el = canvas.value
  if (!el) return
  if (e.target === el) {
    e.stopPropagation()
    if (ownsWheel) {
      e.preventDefault()
      forwardWheelToPage(e)
    }
    el.style.pointerEvents = 'none'
  }
  if (el.style.pointerEvents === 'none') {
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = setTimeout(() => {
      if (canvas.value) canvas.value.style.pointerEvents = ''
      scrollIdleTimer = null
    }, 250)
  }
}
function onPinchGuard(e: TouchEvent) {
  if (e.touches.length >= 2 && isOverCanvas(e)) e.stopPropagation()
}
function onGestureGuard(e: Event) {
  if (isOverCanvas(e)) e.stopPropagation()
}
function bindScrollPinchGuard() {
  ownsWheel = !!getSmoothScroll()?.options.smoothWheel

  window.addEventListener('wheel', onWheelGuard, { capture: true, passive: !ownsWheel })
  window.addEventListener('touchmove', onPinchGuard, true)
  window.addEventListener('gesturestart', onGestureGuard, true)
  window.addEventListener('gesturechange', onGestureGuard, true)
  window.addEventListener('gestureend', onGestureGuard, true)
}
function unbindScrollPinchGuard() {
  window.removeEventListener('wheel', onWheelGuard, true)
  if (scrollIdleTimer) { clearTimeout(scrollIdleTimer); scrollIdleTimer = null }
  if (canvas.value) canvas.value.style.pointerEvents = ''
  window.removeEventListener('touchmove', onPinchGuard, true)
  window.removeEventListener('gesturestart', onGestureGuard, true)
  window.removeEventListener('gesturechange', onGestureGuard, true)
  window.removeEventListener('gestureend', onGestureGuard, true)
}

onMounted(() => {
  bindScrollPinchGuard()
  if (props.noDrag) bindMotionGuard()
  if (inView()) {
    loadScene()
    return
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  schedulePrefetch()
})

onBeforeUnmount(() => {
  unmounted = true
  if (revealTimer) clearTimeout(revealTimer)
  teardownScroll()
  stopRenderGating()
  unbindMotionGuard()
  unbindScrollPinchGuard()
  app.value?.dispose()
  app.value = null
})
</script>

<template>
  <canvas
    ref="canvas"
    class="block size-full transition-opacity duration-700 ease-out"
    :class="revealed ? 'opacity-100' : 'opacity-0'"
    style="touch-action: pan-x pan-y"
  />
</template>
