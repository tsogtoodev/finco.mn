import type { RouterConfig } from '@nuxt/schema'

const stripLocale = (path: string) => path.replace(/^\/(mn|en)(?=\/|$)/, '') || '/'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (stripLocale(to.path) === stripLocale(from.path)) return false
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
}
