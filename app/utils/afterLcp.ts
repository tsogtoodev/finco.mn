// A gate that opens once the page's Largest Contentful Paint has settled.
//
// WHY
// Loading a Spline scene is ONE uninterruptible main-thread task — measured on
// production with a longtask observer, `Application.load()` blocks for 0.15 s
// (map pin) to 2.3 s (the About mission scene), with the scene bytes already in
// the HTTP cache. It is scene-graph and material work, not fill: the same scene
// on a 32x18 canvas costs the same as on 1600x900, so none of the per-frame
// dials in `utils/splineQuality` touch it. Importing the runtime chunk is a
// further ~0.2 s task (1.99 MB decoded).
//
// Fired during the load window that is the LCP element's paint pushed out by
// however long the freeze lasts, plus an unresponsive page for the same
// stretch. Holding it until LCP has landed costs the visitor a second of poster
// image — which is what the fallback <img> is there for — and buys back the
// whole load window.
//
// WHAT "SETTLED" MEANS
// LCP candidates arrive one per progressively larger element as it paints, so a
// quiet stretch with no new candidate means the winner is already on screen.
// We wait QUIET_MS past the last candidate AND past the `load` event, with a
// MAX_WAIT_MS ceiling so a page that never reports one (a tab that loaded in the
// background, a browser without the API) still gets its scenes.
//
// Deliberately NOT resolved by first input: an interaction is exactly when the
// visitor can least afford a two-second freeze.
//
// Resolved once per page load and shared by every caller — the second scene to
// ask gets an already-settled promise. A client-side route change does not
// produce new LCP entries, so scenes on a soft-navigated page load immediately,
// which is correct: there is no paint left to protect.

/** No new LCP candidate for this long → the LCP element has painted. */
const QUIET_MS = 400
/** Ceiling from the first call, for pages that never report an LCP. */
const MAX_WAIT_MS = 4000

let gate: Promise<void> | null = null

export function afterLcp(): Promise<void> {
  if (gate) return gate
  if (typeof window === 'undefined') return Promise.resolve()

  gate = new Promise<void>((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | null = null
    let ceiling: ReturnType<typeof setTimeout> | null = null
    let po: PerformanceObserver | null = null
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      if (quietTimer) clearTimeout(quietTimer)
      if (ceiling) clearTimeout(ceiling)
      po?.disconnect()
      window.removeEventListener('load', restartQuiet)
      resolve()
    }

    function restartQuiet() {
      if (settled) return
      if (quietTimer) clearTimeout(quietTimer)
      quietTimer = setTimeout(finish, QUIET_MS)
    }

    ceiling = setTimeout(finish, MAX_WAIT_MS)

    try {
      // `buffered` so candidates that landed before this ran still count — the
      // component mounts after hydration, well past the first paint.
      po = new PerformanceObserver(restartQuiet)
      po.observe({ type: 'largest-contentful-paint', buffered: true })
    }
    catch {
      po = null // API unavailable — the load event and the ceiling still apply.
    }

    if (document.readyState === 'complete') restartQuiet()
    else window.addEventListener('load', restartQuiet, { once: true })
  })

  return gate
}
