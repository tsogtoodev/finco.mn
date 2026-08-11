// Client half of the CMS boundary (plan §8). Pages branch on the provider
// flag: 'directus' -> the Nuxt /api/cms endpoint (60s-cached, published only),
// anything else -> the existing @nuxt/content queryCollection path. Return
// shapes are identical by construction (see server/utils/cms-normalizers.ts),
// so components never know which provider served them.

export function useCmsProvider(): 'directus' | 'nuxt-content' {
  return useRuntimeConfig().public.cmsProvider === 'directus' ? 'directus' : 'nuxt-content'
}

export function fetchCms<T>(
  collection: 'products' | 'services' | 'branches' | 'jobs' | 'news' | 'legal' | 'pages' | 'configuration',
  query: { locale: string; slug?: string; key?: string; limit?: number },
): Promise<T> {
  // On the server, forward the incoming request's cookies so the CMS endpoint
  // can see the sealed live-preview session (plan §7); useRequestFetch needs
  // the Nuxt context — if a call site loses it, degrade to plain $fetch
  // (public content still works, preview falls back to published).
  let f: typeof $fetch = $fetch
  if (import.meta.server) {
    try {
      f = useRequestFetch()
    } catch {
      /* context lost — published-only fetch */
    }
  }
  return f<T>(`/api/cms/${collection}`, { query }) as Promise<T>
}
