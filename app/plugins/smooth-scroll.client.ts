import Lenis from 'lenis'
import { setSmoothScroll } from '~/utils/smoothScroll'

const LERP = 0.1
const WHEEL = 1
const TOUCH = 1.4

export default defineNuxtPlugin((nuxtApp) => {
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
