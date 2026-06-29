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
     * Suppress pointer-move-driven motion — camera orbit/object dragging AND
     * the scene's "follow cursor" tilt (which otherwise drifts as the page
     * scrolls under a stationary pointer, looking like parallax). Clicks still
     * pass through. Spline has no runtime control toggle, so we swallow move
     * events over the canvas before they reach its listeners.
     */
    noDrag?: boolean
  }>(),
  { rootMargin: 200, noDrag: false },
)

const emit = defineEmits<{ load: [] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
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
    emit('load')
  }
  catch (err) {
    console.error('[SplineScene] failed to load', err)
  }
}

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
  if (pressedOnCanvas || isOverCanvas(e)) e.stopPropagation()
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
  teardownScroll()
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
    :class="loaded ? 'opacity-100' : 'opacity-0'"
    style="touch-action: pan-x pan-y"
  />
</template>
