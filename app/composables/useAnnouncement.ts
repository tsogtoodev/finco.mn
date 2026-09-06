import type { Collections } from '@nuxt/content'

// Copy for the site-wide announcement strip (`announcement` collection, one
// record per locale keyed 'bar'). Provider-aware like the rest of the CMS
// boundary — Directus when NUXT_PUBLIC_CMS_PROVIDER is 'directus', @nuxt/content
// otherwise — with the same shape either way (server/utils/cms-normalizers.ts,
// content/announcement/{mn,en}/bar.yml).
//
// Never lets the fetch throw. The bar renders inside SiteHeader, i.e. on every
// route, so a CMS that is down — or simply has not had
// directus/setup-announcement.mjs run against it yet — must degrade to the i18n
// copy that shipped before this collection existed, not error the whole site.
export type AnnouncementBarContent = {
  enabled: boolean
  text: string
  ctaLabel: string
  ctaUrl: string
}

export async function useAnnouncement() {
  const { locale, t } = useI18n()
  const provider = useCmsProvider()

  const { data } = await useAsyncData(
    () => `announcement-bar-${locale.value}`,
    () =>
      (provider === 'directus'
        ? fetchCms<Collections['announcement'] | null>('announcement', {
            locale: locale.value,
            key: 'bar',
          })
        : queryCollection('announcement')
            .where('locale', '=', locale.value)
            .where('key', '=', 'bar')
            .first()
      ).catch(() => null),
    { watch: [locale], default: () => null },
  )

  // Falls back per-field, not all-or-nothing: a record that exists but has an
  // empty CTA label still gets the CMS text.
  return computed<AnnouncementBarContent>(() => {
    const row = data.value
    return {
      // No record at all -> fall back to the i18n copy (enabled). A record that
      // says `enabled: false` is an editor turning the bar off, so it wins.
      enabled: row ? row.enabled !== false : true,
      text: row?.text || t('announcement.text'),
      ctaLabel: row?.ctaLabel || t('announcement.cta'),
      ctaUrl: row?.ctaUrl || '/products',
    }
  })
}
