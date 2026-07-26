import type Lenis from 'lenis'

// Module-scoped handle on the single Lenis instance created by
// `plugins/smooth-scroll.client.ts`. Kept here (rather than on `nuxtApp`) so
// plain functions outside a Vue setup context — `useScrollLock`'s
// lock/unlockBodyScroll, which run from event handlers — can reach it without
// needing an injection context. Null on the server and for reduced-motion
// users, where no instance is ever created, so every caller must optional-chain.

let instance: Lenis | null = null

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis
}

export function getSmoothScroll() {
  return instance
}
