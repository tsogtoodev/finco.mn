export type SiteConfigKey =
  | 'contact_phone'
  | 'contact_email'
  | 'social_facebook'
  | 'social_instagram'
  | 'social_youtube'

type ConfigRow = { key: string; value: string }

export async function useSiteSettings() {
  const { locale } = useI18n()
  const provider = useCmsProvider()

  const { data } = await useAsyncData(
    'site-configuration',
    () =>
      (provider === 'directus'
        ? fetchCms<ConfigRow[]>('configuration', { locale: locale.value })
        : queryCollection('configuration').all()
      ).catch(() => [] as ConfigRow[]),
    { default: () => [] as ConfigRow[] },
  )

  const entries = computed(() => {
    const map = new Map<string, string>()
    for (const row of (data.value ?? []) as ConfigRow[]) {
      if (row?.key && row.value) map.set(row.key, row.value)
    }
    return map
  })

  function config(key: SiteConfigKey | (string & {}), fallback = '') {
    return computed(() => entries.value.get(key) ?? fallback)
  }

  return { entries, config }
}
