import type Lenis from 'lenis'

let instance: Lenis | null = null

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis
}

export function getSmoothScroll() {
  return instance
}
