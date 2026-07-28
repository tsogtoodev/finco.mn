// Subscribe a scroll-driven effect to the smooth-scroll layer.
//
// Scroll-driven visuals (HomeHero's pinned card, AboutMission's pin, the
// AboutCeoMessage fractal) used to listen to the native `scroll` event and
// coalesce their work into a requestAnimationFrame. That trails the page by a
// frame whenever Lenis is driving:
//
//   frame N   — Lenis' rAF advances the animation and writes the scroll position,
//               then emits 'scroll' synchronously. The browser paints frame N at
//               the new offset.
//   frame N+1 — the browser's "run the scroll steps" fires the native `scroll`
//               event for what happened in frame N. A handler reacting here only
//               reaches the screen in frame N+1.
//
// So the effect lands one frame (~16ms) after the scroll it is reacting to, which
// reads as the pinned/parallax content lagging slightly behind the page. Binding
// to Lenis' own 'scroll' event instead puts the effect in frame N, alongside the
// scroll that caused it.
//
// Lenis' event is a strict superset of the native one: `onNativeScroll` emits for
// keyboard, scrollbar-drag and programmatic scrolls too, so nothing is lost by
// switching sources. When there is no instance at all — reduced-motion users, for
// whom the plugin never constructs one — this falls back to the native listener
// with the rAF coalescing it always had.

import { getSmoothScroll } from '~/utils/smoothScroll'

export function useScrollSync(sync: () => void) {
  let rafId = 0
  let unsubscribe: (() => void) | null = null
  let attached = false

  // Coalesced runner. Used for `resize` (which arrives in bursts and is not a
  // Lenis event) and for the whole native fallback path.
  function schedule() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      sync()
    })
  }

  function start() {
    if (attached) return
    attached = true

    const lenis = getSmoothScroll()
    if (lenis) {
      // Called directly, NOT coalesced: Lenis emits at most once per frame and
      // does it from inside its own rAF, so deferring to another frame would
      // reintroduce exactly the lag this exists to remove.
      unsubscribe = lenis.on('scroll', sync)
    }
    else {
      window.addEventListener('scroll', schedule, { passive: true })
    }
    window.addEventListener('resize', schedule, { passive: true })
  }

  function stop() {
    if (!attached) return
    attached = false

    unsubscribe?.()
    unsubscribe = null
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  onBeforeUnmount(stop)

  // `schedule` is returned for callers that need to re-run the effect from a
  // source of their own (a ResizeObserver, a media-query change).
  return { start, stop, schedule }
}
