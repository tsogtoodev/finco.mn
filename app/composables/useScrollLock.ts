// Reference-counted <body> scroll lock.
//
// Two things lock page scrolling — the mobile nav drawer (SiteHeader) and
// AppDialog — and they can be open at the same time (the floating action button
// sits above the drawer). A plain `overflow = 'hidden'` / `overflow = ''` pair in
// each would mean whichever closes FIRST unlocks the page behind the other, so
// the content scrolls away underneath a panel that is still open.
//
// Counting the locks instead means the page only unlocks when the last holder
// releases. Module scope is deliberate — the count is shared across callers — and
// it is only ever touched in the browser, so there is no SSR cross-request state.

let lockCount = 0
let savedOverflow = ''

export function lockBodyScroll() {
  if (import.meta.server) return
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBodyScroll() {
  if (import.meta.server) return
  if (lockCount === 0) return
  lockCount--
  if (lockCount === 0) document.body.style.overflow = savedOverflow
}
