import type { Collections } from '@nuxt/content'

export async function usePageContent(key: Collections['pages']['key']) {
  const { locale } = useI18n()
  const provider = useCmsProvider()

  const { data } = await useAsyncData(
    () => `page-${key}-${locale.value}`,
    () =>
      provider === 'directus'
        ? fetchCms<Collections['pages'] | null>('pages', { locale: locale.value, key })
        : queryCollection('pages')
            .where('locale', '=', locale.value)
            .where('key', '=', key)
            .first(),
    { watch: [locale] },
  )

  return data
}
