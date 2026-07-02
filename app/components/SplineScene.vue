<script setup lang="ts">
// Lazy Spline scene renderer. Loads @splinetool/runtime and the .splinecode
// scene only once the canvas scrolls near the viewport, so the WebGL payload
// never blocks initial load. Client-only by nature.
//
// Visibility is detected with getBoundingClientRect + passive scroll/resize
// listeners rather than IntersectionObserver: IO is simpler but doesn't fire in
// some embedded/headless renderers, and a rect check is reliable everywhere.
// The listeners self-remove after the scene loads.
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const props = withDefaults(
  defineProps<{
    /** URL of the exported .splinecode scene. */
    scene: string
    /** Pre-load margin (px) around the viewport before the canvas is visible. */
    rootMargin?: number
    /**
     * Suppress click-drag interaction — camera orbit / object dragging — by
     * swallowing move events that occur *while a press is held on the canvas*.
     * Bare hover (and the scene's cursor-follow tilt) and plain clicks still
     * pass through. Spline has no runtime control toggle, so we catch the drag
     * moves in the window capture phase before they reach its listeners.
     */
    noDrag?: boolean
    /**
     * Hold the canvas hidden for this many ms *after* the scene finishes
     * loading, then run the fade-in. The scene still loads and renders
     * immediately — only its reveal is delayed — so it's already animating by
     * the time it fades in. 0 = reveal as soon as it loads (default).
     */
    revealDelay?: number
  }>(),
  { rootMargin: 200, noDrag: false, revealDelay: 0 },
)

const emit = defineEmits<{ load: [] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
// Drives the fade-in — flips `revealDelay` ms after the scene has loaded.
const revealed = ref(false)
let revealTimer: ReturnType<typeof setTimeout> | null = null
// shallowRef: the Spline Application is a large non-reactive instance.
const app = shallowRef<import('@splinetool/runtime').Application | null>(null)

function inView() {
  const el = canvas.value
  if (!el) return false
  const r = el.getBoundingClientRect()
  const m = props.rootMargin
  // width > 0 also skips the responsive `hidden` case (no layout box).
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

async function loadScene() {
  if (app.value || !canvas.value) return
  try {
    const { Application } = await import('@splinetool/runtime')
    app.value = new Application(canvas.value)
    await app.value.load(props.scene)
    loaded.value = true
    // Delay the fade-in without delaying the load/render itself.
    if (props.revealDelay > 0) revealTimer = setTimeout(() => { revealed.value = true }, props.revealDelay)
    else revealed.value = true
    startRenderGating()
    emit('load')
  }
  catch (err) {
    console.error('[SplineScene] failed to load', err)
  }
}

// --- render gating (perf / thermals) ----------------------------------------
// The Spline runtime renders every frame for as long as it's alive and does NOT
// pause when scrolled offscreen, so each scene keeps the GPU busy continuously.
// With several scenes on one page (home has two), an idle tab parked anywhere —
// even the pure-CSS hero, where no scene is visible — still burns every scene's
// render loop, which heats the machine over a few minutes.
//
// Once loaded we drive app.stop()/play() off the canvas's viewport visibility
// (IntersectionObserver) AND the tab's visibility, so only an on-screen scene in
// a foregrounded tab renders. stop() halts the rAF loop (0 GPU) and keeps the last
// frame on the canvas, so resuming is seamless. If IO is unavailable the scene
// just keeps rendering — i.e. the prior behaviour, never worse.
let io: IntersectionObserver | null = null
let onScreen = true

function syncRender() {
  const a = app.value
  if (!a) return
  const active = onScreen && !document.hidden
  if (active && a.isStopped) a.play()
  else if (!active && !a.isStopped) a.stop()
}

function startRenderGating() {
  // Bail if the component unmounted during the async load (app already disposed),
  // so we don't attach listeners that onBeforeUnmount has already torn down.
  if (!app.value) return
  document.addEventListener('visibilitychange', syncRender)
  if (typeof IntersectionObserver !== 'undefined' && canvas.value) {
    // 200px margin keeps a scene rendering just before it scrolls into view, so
    // it's already animating by the time it's seen.
    io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting ?? true
      syncRender()
    }, { rootMargin: '200px' })
    io.observe(canvas.value)
  }
  syncRender()
}

function stopRenderGating() {
  document.removeEventListener('visibilitychange', syncRender)
  io?.disconnect()
  io = null
}
// ---------------------------------------------------------------------------

// --- motion suppression -----------------------------------------------------
// Block move events over the canvas so the scene only reacts to clicks. Caught
// in the window capture phase → fires before Spline's own canvas/document
// listeners regardless of registration order. pointerdown/up are left alone so
// clicks still register. Covers both a drag (press began on the canvas) and a
// bare hover/scroll-induced move whose target is the canvas.
let pressedOnCanvas = false

function isOverCanvas(e: Event) {
  return !!canvas.value && e.target === canvas.value
}
function onPressStart(e: PointerEvent | TouchEvent) {
  const target = 'touches' in e ? e.touches[0]?.target : e.target
  pressedOnCanvas = !!canvas.value && target === canvas.value
}
function onMove(e: Event) {
  // Block only moves that are part of a press-drag (camera orbit / object drag).
  // Bare hover passes through, so the scene's cursor-follow interaction works.
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
// ---------------------------------------------------------------------------
function onWheelGuard(e: WheelEvent) {
  if (isOverCanvas(e)) e.stopPropagation()
}
function onPinchGuard(e: TouchEvent) {
  // Two-finger touch = pinch; single-finger passes through (page scroll).
  if (e.touches.length >= 2 && isOverCanvas(e)) e.stopPropagation()
}
function onGestureGuard(e: Event) {
  // Safari trackpad pinch (gesture* events).
  if (isOverCanvas(e)) e.stopPropagation()
}
function bindScrollPinchGuard() {
  window.addEventListener('wheel', onWheelGuard, true)
  window.addEventListener('touchmove', onPinchGuard, true)
  window.addEventListener('gesturestart', onGestureGuard, true)
  window.addEventListener('gesturechange', onGestureGuard, true)
  window.addEventListener('gestureend', onGestureGuard, true)
}
function unbindScrollPinchGuard() {
  window.removeEventListener('wheel', onWheelGuard, true)
  window.removeEventListener('touchmove', onPinchGuard, true)
  window.removeEventListener('gesturestart', onGestureGuard, true)
  window.removeEventListener('gesturechange', onGestureGuard, true)
  window.removeEventListener('gestureend', onGestureGuard, true)
}
// ---------------------------------------------------------------------------

onMounted(() => {
  bindScrollPinchGuard()
  if (props.noDrag) bindMotionGuard()
  if (inView()) {
    loadScene()
    return
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
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
