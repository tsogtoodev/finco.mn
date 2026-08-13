const QUIET_MS = 400
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
      po = new PerformanceObserver(restartQuiet)
      po.observe({ type: 'largest-contentful-paint', buffered: true })
    }
    catch {
      po = null
    }

    if (document.readyState === 'complete') restartQuiet()
    else window.addEventListener('load', restartQuiet, { once: true })
  })

  return gate
}
