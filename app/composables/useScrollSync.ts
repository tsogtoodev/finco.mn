import { getSmoothScroll } from '~/utils/smoothScroll'

export function useScrollSync(sync: () => void) {
  let rafId = 0
  let unsubscribe: (() => void) | null = null
  let attached = false

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

  return { start, stop, schedule }
}
