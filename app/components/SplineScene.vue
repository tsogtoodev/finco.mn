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
import { getSmoothScroll } from '~/utils/smoothScroll'

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
    /**
     * Camera zoom applied via the Spline runtime after the scene loads.
     * < 1 zooms out (scene smaller/farther), > 1 zooms in. 1 = the scene's
     * exported camera, untouched (default).
     */
    zoom?: number
    /**
     * Treat this scene as important: `preconnect` to the Spline CDN from the
     * SSR'd head, and warm the runtime + `.splinecode` immediately on mount
     * rather than waiting for browser idle. For the scenes a visitor reliably
     * reaches (the About mission pin, the contact CTA) this removes the pause
     * between scrolling to the section and the scene appearing.
     */
    preload?: boolean
  }>(),
  { rootMargin: 200, noDrag: false, revealDelay: 0, zoom: 1, preload: false },
)

// The `preconnect`/`dns-prefetch` for the Spline CDN lives in nuxt.config's
// app.head, not here: every usage of this component is inside <ClientOnly>, so a
// useHead in this setup never runs during SSR and the hint would arrive only
// after hydration — too late to save the DNS + TLS round trips it exists for.
//
// Deliberately no `<link rel="preload" as="fetch">` for the scene itself either.
// It is ~1MB of runtime plus the scene payload; a hard preload on a below-fold
// asset competes with the LCP image and logs "preloaded but not used" for every
// visitor who never scrolls that far. `preload` here means "skip the idle wait"
// (see schedulePrefetch) — early, but still yielding to the critical path.

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
    if (props.zoom !== 1) app.value.setZoom(props.zoom)
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

// Warm the cache during browser idle so a below-the-fold scene loads (near-)
// instantly once it scrolls into view: pull the shared @splinetool/runtime chunk
// (the ~1MB payload; the ESM module cache dedupes it across every scene) and this
// scene's .splinecode into the HTTP cache ahead of the scroll trigger. `loadScene`
// then reuses both. Skipped on data-saver / 2G so we don't spend metered bandwidth
// a bouncing visitor never uses.
function schedulePrefetch() {
  if (app.value || typeof window === 'undefined') return
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn?.saveData || /(?:^|-)2g$/.test(conn?.effectiveType ?? '')) return

  const warm = () => {
    if (app.value) return
    // A CSS-hidden wrapper (`hidden sm:block`, `hidden lg:block`) still MOUNTS
    // this component. The render path already copes — `inView()` guards on
    // `r.width > 0` — but the prefetch had no such guard, so a phone downloaded
    // the ~1MB runtime plus the .splinecode of every scene it can never show.
    // Zero width means "not laid out"; a scene merely below the fold still has
    // width, so genuine ahead-of-scroll prefetch is unaffected. Checked here
    // rather than at schedule time so it reflects layout at the idle callback.
    if (!canvas.value || canvas.value.getBoundingClientRect().width === 0) return
    import('@splinetool/runtime').catch(() => {})
    fetch(props.scene).catch(() => {})
  }
  // `preload` scenes skip the idle wait entirely — the whole point is to be
  // fetching while the visitor is still reading the top of the page, not to
  // queue behind whatever else the main thread is doing. The data-saver and
  // zero-width guards above still apply, so a phone that can never show the
  // scene still downloads nothing.
  if (props.preload) warm()
  else if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 })
  else setTimeout(warm, 1500)
}

// --- render gating (perf / thermals) ----------------------------------------
// The Spline runtime renders every frame for as long as it's alive and does NOT
// pause when scrolled offscreen, so each scene keeps the GPU busy continuously.
// With several scenes on one page (home has two), an idle tab parked anywhere —
// even the pure-CSS hero, where no scene is visible — still burns every scene's
// render loop, which heats the machine over a few minutes.
//
// Once loaded we gate rendering off the canvas's viewport visibility
// (IntersectionObserver) AND the tab's visibility, so only an on-screen scene in
// a foregrounded tab renders. If IO is unavailable the scene just keeps
// rendering — i.e. the prior behaviour, never worse.
//
// Gating detaches ONLY the render loop (renderer.setAnimationLoop(null) → rAF
// off, 0 GPU, last frame stays on the canvas). It must NOT use the public
// app.stop()/play() pair: stop() is a destructive teardown — it deactivates the
// whole event manager and runs mixer.stopAllAction(), killing every playing
// animation — and play() re-dispatches the scene's Start events into a frame
// clock whose _lastTime was never reset, so the first resumed frame gets
// dt = the entire time spent offscreen. That giant delta fast-forwards every
// finite (non-looping) animation to its end, where clampWhenFinished freezes it
// until a full page reload. Resetting _lastTime before re-attaching the loop
// makes resume seamless: animations continue mid-flight from where they paused.
let io: IntersectionObserver | null = null
let onScreen = true
let renderActive = true

// Private runtime internals (verified against @splinetool/runtime 1.12.98).
// `render` is a bound arrow field on Application — exactly what the runtime's
// own play() passes to setAnimationLoop.
type RuntimeInternals = {
  _renderer?: { setAnimationLoop: (fn: ((t: number) => void) | null) => void }
  _lastTime?: number
  render?: (t: number) => void
}

function syncRender() {
  const a = app.value
  if (!a) return
  const active = onScreen && !document.hidden
  if (active === renderActive) return
  renderActive = active
  const g = a as unknown as RuntimeInternals
  if (g._renderer?.setAnimationLoop && typeof g.render === 'function') {
    if (active) {
      // Falsy _lastTime → the runtime skips the dt computation on the first
      // resumed frame instead of seeing the whole offscreen gap as one delta.
      g._lastTime = 0
      g._renderer.setAnimationLoop(g.render)
    }
    else {
      g._renderer.setAnimationLoop(null)
    }
  }
  else {
    // Internals moved in a runtime upgrade — fall back to the public pair.
    // Coarser (animations restart / can freeze) but never renders offscreen.
    if (active && a.isStopped) a.play()
    else if (!active && !a.isStopped) a.stop()
  }
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
// Wheel over the canvas has three problems to solve at once:
//  1. Spline's wheel-to-zoom — blocked by stopPropagation (capture phase, so the
//     event never descends to Spline's own listener on the canvas).
//  2. Scroll jank — Spline registers a NON-PASSIVE wheel listener on the canvas,
//     so the browser forces main-thread ("janky/finicky") scrolling over the
//     canvas region even when the zoom is blocked. Dropping the canvas out of
//     hit-testing for the duration of the scroll makes the wheel target the page
//     instead; cursor-follow resumes ~250ms after the wheel stops. This is a
//     no-op for scenes whose wrapper is already pointer-events:none (the canvas
//     is never the wheel target, and we never set its inline pointer-events).
//  3. The smooth-scroll layer getting skipped. This one is why scrolling used to
//     break up around Spline sections. Lenis listens for `wheel` on WINDOW in the
//     BUBBLE phase, i.e. AFTER the canvas in the propagation path — so the
//     stopPropagation in (1), fired from the window CAPTURE phase, stopped the
//     event reaching Lenis too. The page then scrolled natively for that event
//     while Lenis was mid-glide, and because Lenis ignores a native scroll that
//     arrives while `isScrolling === 'smooth'`, its target went stale and the
//     next frame yanked the page back. One native jump plus a snap-back, at the
//     start of every gesture begun over a scene.
//
//     Fixing it means handing the page an equivalent event that Spline cannot
//     see: cancel the real one (so nothing scrolls natively) and re-dispatch a
//     copy directly on window, where Lenis picks it up and applies its own
//     multipliers. The copy targets window rather than the canvas, so it neither
//     re-enters this guard nor matches any `data-lenis-prevent`.
//
//     Only done when the smooth-scroll layer actually owns the wheel. For
//     reduced-motion users the plugin builds no Lenis at all, and cancelling the
//     native scroll without a replacement would leave the page unscrollable over
//     a scene — so there we keep the old passive, stopPropagation-only path.
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
    // Not bubbling, dispatched on window: `target` is window, so `e.target === el`
    // below is false and this cannot loop.
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
  // Two-finger touch = pinch; single-finger passes through (page scroll).
  if (e.touches.length >= 2 && isOverCanvas(e)) e.stopPropagation()
}
function onGestureGuard(e: Event) {
  // Safari trackpad pinch (gesture* events).
  if (isOverCanvas(e)) e.stopPropagation()
}
function bindScrollPinchGuard() {
  // Resolved once: the Lenis plugin runs before any component mounts and the
  // instance never swaps mid-session.
  ownsWheel = !!getSmoothScroll()?.options.smoothWheel

  // Non-passive only when we intend to cancel the native scroll and forward to
  // Lenis. That costs nothing extra there — Lenis already holds a non-passive
  // wheel listener on window, so wheel handling is main-thread either way. With
  // no Lenis we stay passive, exactly as before.
  window.addEventListener('wheel', onWheelGuard, { capture: true, passive: !ownsWheel })
  window.addEventListener('touchmove', onPinchGuard, true)
  window.addEventListener('gesturestart', onGestureGuard, true)
  window.addEventListener('gesturechange', onGestureGuard, true)
  window.addEventListener('gestureend', onGestureGuard, true)
}
function unbindScrollPinchGuard() {
  window.removeEventListener('wheel', onWheelGuard, true)
  // Restore hit-testing if we tore down mid-scroll, and drop the idle timer.
  if (scrollIdleTimer) { clearTimeout(scrollIdleTimer); scrollIdleTimer = null }
  if (canvas.value) canvas.value.style.pointerEvents = ''
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
  schedulePrefetch()
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
