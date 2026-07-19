import type { Collections } from '@nuxt/content'

export type Audience = Collections['products']['audience']
export type ProductDoc = Collections['products']

// Locale-keyed, ordered fetch of the products catalog (optionally filtered to
// one audience). The mega menu, footer, listing grids and home carousel all
// render from this same CMS-managed catalog — adding a product doc in the CMS
// propagates everywhere. Keys dedupe per (audience, locale), and `watch:
// [locale]` re-queries on language switch instead of serving stale copy.
// Provider-aware: on Directus the endpoint returns the whole locale catalog
// (one shared 60s cache entry) and audience filtering happens here.
export async function useProductList(audience?: Audience) {
  const { locale } = useI18n()
  const provider = useCmsProvider()

  const { data } = await useAsyncData(
    () => `products-${audience ?? 'all'}-${locale.value}`,
    async () => {
      if (provider === 'directus') {
        const all = await fetchCms<ProductDoc[]>('products', { locale: locale.value })
        return audience ? all.filter((p) => p.audience === audience) : all
      }
      let q = queryCollection('products')
        .where('locale', '=', locale.value)
        .order('order', 'ASC')
      if (audience) q = q.where('audience', '=', audience)
      return q.all()
    },
    { watch: [locale], default: () => [] as ProductDoc[] },
  )

  return data
}
