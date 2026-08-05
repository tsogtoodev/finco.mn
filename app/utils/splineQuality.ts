// Central render-cost policy for every <SplineScene> on the site.
//
// WHY THIS FILE EXISTS
// Measured on the live site (see perf-research.md): /about asked the GPU for 24
// full-screen post-processing passes, 92.6 megapixels of fill and 522 draw calls
// EVERY FRAME, across two WebGL contexts; / asked for 32 passes, 48.9 MP and 429
// draw calls. That is more pixel work than a 4K game frame, on a marketing site —
// integrated graphics land at ~10fps. Every dial that brings it down lives here,
// so the whole intervention can be tuned (or reverted) from one place.
//
// The scenes themselves (poly counts, per-object draw calls, texture sizes) can
// only be fixed in the Spline editor; this file covers everything reachable from
// code.

/**
 * Ceiling on the WebGL drawing-buffer scale, as a multiple of CSS pixels.
 *
 * The Spline runtime derives its pixel ratio from the scene's publish settings
 * (`_getPixelRatio`: `0 → window.devicePixelRatio`, `1 → 1`, `2 → 2`) and those
 * default to `0`. So every scene rendered at 2x on retina and 1.25–1.5x on a
 * scaled Windows laptop — for soft, out-of-focus decoration. Capping at 1 was
 * measured at 5.7x faster per frame on the About mission scene; individual call
 * sites go below 1 where the scene is blurred and/or already CSS-upscaled.
 */
export const SPLINE_MAX_PIXEL_RATIO = 1

/**
 * Frame-rate ceiling for a scene's render loop. None of these scenes are
 * interactive 3D — they are ambient loops — so halving the frame rate halves
 * every number in the measurements above and is close to invisible. This is the
 * first dial to raise if a scene reads as choppy.
 */
export const SPLINE_MAX_FPS = 30

/**
 * How many scenes may render simultaneously. Both `/` and `/about` mount two,
 * and on `/` the stats section is `sticky top-0`, so it stayed on-screen (and
 * rendering) for the entire products scroll while a second scene rendered too.
 */
export const SPLINE_MAX_CONCURRENT = 1

// --- device gate -------------------------------------------------------------
// Every call site already has a static fallback image (the scenes are decoration
// over a raster that matches them). Below this bar we show that image and never
// create a WebGL context at all — no 1.5MB scene download, no multi-second
// parse/upload stall, no render loop.

let deviceVerdict: boolean | null = null

/** Number of logical cores at or below which scenes are skipped. */
const MIN_CORES = 4
/** GB of RAM (navigator.deviceMemory, coarse) at or below which scenes are skipped. */
const MIN_MEMORY_GB = 4

/**
 * GPU substrings that reliably cannot afford these scenes. Deliberately narrow:
 * software rasterisers and the older integrated Intel parts. Newer integrated
 * GPUs (Iris Xe, Arc, Apple) are left to the core/memory heuristics so we don't
 * strip the design from machines that can cope.
 */
const SLOW_GPU = [
  'swiftshader', // Chrome's software rasteriser — no GPU at all
  'llvmpipe',
  'software',
  'basic render',
  'microsoft basic',
  'intel(r) hd graphics', // Gen7/8/9 integrated
  'intel hd graphics',
  'mesa offscreen',
]

function gpuIsSlow(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return true // no WebGL → definitely use the image
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    // Release the probe context immediately; browsers cap concurrent contexts
    // and each live scene already needs one.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (!name) return false
    const lower = name.toLowerCase()
    return SLOW_GPU.some(s => lower.includes(s))
  }
  catch {
    return false // never let the probe itself break the page
  }
}

/**
 * Whether this device should run Spline scenes at all. Decided once per page
 * load and cached — the inputs don't change mid-session and the GPU probe costs
 * a throwaway WebGL context.
 */
export function splineDeviceAllowed(): boolean {
  if (deviceVerdict !== null) return deviceVerdict
  if (typeof window === 'undefined') return (deviceVerdict = false)

  // Reduced motion: the smooth-scroll layer already opts these users out
  // entirely, Spline never did. Ambient 3D motion is exactly what the
  // preference is about.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return (deviceVerdict = false)

  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
  if ((nav.hardwareConcurrency ?? 8) <= MIN_CORES) return (deviceVerdict = false)
  if ((nav.deviceMemory ?? 8) <= MIN_MEMORY_GB) return (deviceVerdict = false)
  if (gpuIsSlow()) return (deviceVerdict = false)

  return (deviceVerdict = true)
}

// --- render coordinator ------------------------------------------------------
// Scenes report how much of themselves is on screen; only the most-visible
// SPLINE_MAX_CONCURRENT of them keep a render loop attached. Everything else
// holds its last painted frame at zero GPU cost.

export type SplineParticipant = {
  /** Visible fraction of the canvas, 0 when off screen. */
  ratio: number
  /** Attach (true) or detach (false) this scene's render loop. */
  setRendering: (on: boolean) => void
}

const participants = new Set<SplineParticipant>()
let documentHidden = false
let visibilityBound = false

function onVisibility() {
  documentHidden = document.hidden
  rebalanceSplineScenes()
}

export function registerSplineScene(p: SplineParticipant) {
  participants.add(p)
  if (!visibilityBound && typeof document !== 'undefined') {
    visibilityBound = true
    documentHidden = document.hidden
    document.addEventListener('visibilitychange', onVisibility)
  }
  rebalanceSplineScenes()
}

export function unregisterSplineScene(p: SplineParticipant) {
  participants.delete(p)
  if (participants.size === 0 && visibilityBound) {
    visibilityBound = false
    document.removeEventListener('visibilitychange', onVisibility)
  }
  else {
    rebalanceSplineScenes()
  }
}

/**
 * Re-decide which scenes render. Called whenever any scene's visibility changes
 * or the tab is backgrounded. Cheap: a sort over at most a handful of entries.
 */
export function rebalanceSplineScenes() {
  if (documentHidden) {
    participants.forEach(p => p.setRendering(false))
    return
  }
  const ranked = [...participants]
    .filter(p => p.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)
  const winners = new Set(ranked.slice(0, SPLINE_MAX_CONCURRENT))
  participants.forEach(p => p.setRendering(winners.has(p)))
}
