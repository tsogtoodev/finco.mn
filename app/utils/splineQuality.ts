export const SPLINE_MAX_PIXEL_RATIO = 2

export const SPLINE_MAX_FPS = 60

export const SPLINE_MAX_CONCURRENT = 1

let deviceVerdict: boolean | null = null

const MIN_CORES = 4
const MIN_MEMORY_GB = 4

const SLOW_GPU = [
  'swiftshader',
  'llvmpipe',
  'software',
  'basic render',
  'microsoft basic',
  'intel(r) hd graphics',
  'intel hd graphics',
  'mesa offscreen',
]

function gpuIsSlow(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return true
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (!name) return false
    const lower = name.toLowerCase()
    return SLOW_GPU.some(s => lower.includes(s))
  }
  catch {
    return false
  }
}

export function splineDeviceAllowed(): boolean {
  if (deviceVerdict !== null) return deviceVerdict
  if (typeof window === 'undefined') return (deviceVerdict = false)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return (deviceVerdict = false)

  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
  if ((nav.hardwareConcurrency ?? 8) <= MIN_CORES) return (deviceVerdict = false)
  if ((nav.deviceMemory ?? 8) <= MIN_MEMORY_GB) return (deviceVerdict = false)
  if (gpuIsSlow()) return (deviceVerdict = false)

  return (deviceVerdict = true)
}

export type SplineParticipant = {
  ratio: number
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
