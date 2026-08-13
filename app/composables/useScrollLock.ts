import { getSmoothScroll } from '~/utils/smoothScroll'

let lockCount = 0
let savedOverflow = ''

export function lockBodyScroll() {
  if (import.meta.server) return
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getSmoothScroll()?.stop()
  }
  lockCount++
}

export function unlockBodyScroll() {
  if (import.meta.server) return
  if (lockCount === 0) return
  lockCount--
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow
    getSmoothScroll()?.start()
  }
}
