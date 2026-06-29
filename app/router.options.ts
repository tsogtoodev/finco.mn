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
    return { top: 0 }
  },
}
