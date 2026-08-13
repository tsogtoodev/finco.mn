export function useCmsProvider(): 'directus' | 'nuxt-content' {
  return useRuntimeConfig().public.cmsProvider === 'directus' ? 'directus' : 'nuxt-content'
}

export function fetchCms<T>(
  collection: 'products' | 'services' | 'branches' | 'jobs' | 'news' | 'legal' | 'pages' | 'configuration',
  query: { locale: string; slug?: string; key?: string; limit?: number },
): Promise<T> {
  let f: typeof $fetch = $fetch
  if (import.meta.server) {
    try {
      f = useRequestFetch()
    } catch {
    }
  }
  return f<T>(`/api/cms/${collection}`, { query }) as Promise<T>
}
