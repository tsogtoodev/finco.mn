import type { Collections } from '@nuxt/content'

export type Audience = Collections['products']['audience']
export type ProductDoc = Collections['products']

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
