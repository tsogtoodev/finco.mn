import type { Collections } from '@nuxt/content'

// Locale-keyed fetch for a static page's structured copy (`pages` collection).
// The key embeds locale + key and watches `locale`, so switching language
// re-queries instead of serving stale copy (the #1 i18n+content trap).
// Provider-aware: reads the Directus CMS boundary when NUXT_PUBLIC_CMS_PROVIDER
// is 'directus'; return shape is identical (see server/utils/cms-normalizers.ts).
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
