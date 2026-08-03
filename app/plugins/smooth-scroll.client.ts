import Lenis from 'lenis'
import { setSmoothScroll } from '~/utils/smoothScroll'

// Site-wide inertial ("weighted") scrolling.
//
// Lenis drives the REAL scroll position (window.scrollTo under the hood) rather
// than transforming a wrapper, so everything already built on scroll keeps
// working untouched: window.scrollY readers (SiteHeader, AutoNextNews), sticky
// pins (AboutMission, the news reading ruler), IntersectionObserver reveals and
// the Spline scroll interactions.
//
// Wheel smoothing runs on EVERY platform, macOS included.
//
// This was briefly gated off on Apple platforms, on the theory that stacking
// Lenis' easing on top of the OS' own trackpad momentum is what made fast
// scrolling feel loose. The mechanism is real — macOS keeps emitting a decaying
// tail of `wheel` events after the fingers lift, and Lenis adds every one of
// those deltas to its target — but it is not a defect: lenis.dev itself ships
// exactly that (smoothWheel on, lerp 0.1, no delta filtering, no platform gate)
// and is the reference for how this is supposed to feel. Matching it here.
//
// Feel is tuned by the three constants below.
//   LERP  — how much of the remaining distance is covered each frame. LOWER is
//           heavier: the wheel sets a target and the page eases toward it over
//           more frames. 0.1 matches both the library default and lenis.dev.
//   WHEEL — wheel delta multiplier. 1 is lenis.dev's value; this was 0.9, which
//           trimmed each notch slightly to read as mass. Drop it back if the
//           full-strength notch feels too eager.
//   TOUCH — touch delta multiplier. Touch stays native (`syncTouch` off), so
//           phones keep the OS momentum they already had; this only trims the
//           drag distance to match the desktop weight.
const LERP = 0.1
const WHEEL = 1
const TOUCH = 1.4

export default defineNuxtPlugin((nuxtApp) => {
  // Reduced motion: leave scrolling entirely native, no instance at all.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const lenis = new Lenis({
    lerp: LERP,
    wheelMultiplier: WHEEL,
    touchMultiplier: TOUCH,
    gestureOrientation: 'vertical',
    allowNestedScroll: false,
    autoRaf: true,
    anchors: { offset: -96 },
    stopInertiaOnNavigate: true,
  })

  setSmoothScroll(lenis)

  // Dev-only console handle for tuning the feel live: `__lenis.options.lerp = 0.1`.
  if (import.meta.dev) (window as unknown as { __lenis?: Lenis }).__lenis = lenis

  const router = useRouter()
  router.afterEach(() => lenis.reset())

  nuxtApp.hook('app:unmount', () => {
    setSmoothScroll(null)
    lenis.destroy()
  })

  return {
    provide: { lenis },
  }
})
