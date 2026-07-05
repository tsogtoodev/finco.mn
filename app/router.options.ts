import type { RouterConfig } from '@nuxt/schema'

// Drop a leading locale prefix (/mn, /en) so we can tell when two routes are the
// "same page, different language" — switching locale changes the path prefix
// but shouldn't be treated as navigating to a new page.
const stripLocale = (path: string) => path.replace(/^\/(mn|en)(?=\/|$)/, '') || '/'

export default <RouterConfig>{
  // Default Nuxt behavior is "scroll to top on every route change", which yanks
  // the page to the top when the LocaleSwitcher swaps /mn ↔ /en. Keep the
  // current scroll position when only the locale changes; otherwise behave as
  // usual (restore back/forward position, else top).
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (stripLocale(to.path) === stripLocale(from.path)) return false
    // `behavior: 'smooth'` eases the jump to top on a page change; it defers to
    // the user's reduced-motion preference via the `html { scroll-behavior }`
    // rule in main.css, and to an in-page `#hash` anchor when one is present.
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
}
