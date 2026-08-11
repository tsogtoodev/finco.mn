// Site-wide key/value settings (the `configuration` collection): contact
// details, social links — anything that is one value for the whole site rather
// than copy belonging to a page.
//
// Provider-aware like the rest of the CMS boundary: Directus when
// NUXT_PUBLIC_CMS_PROVIDER is 'directus', @nuxt/content otherwise, with the same
// {key, value} rows either way (server/utils/cms-normalizers.ts,
// content/configuration/*.yml).
//
// Unlike every other collection this one is NOT translated — a phone number and
// a Facebook URL read the same in every locale. `locale` is still passed to the
// endpoint (it validates one) but no locale is in the cache key and switching
// language does not refetch.

/** Keys that exist today. Widen as entries are added — the lookup accepts any string. */
export type SiteConfigKey =
  | 'contact_phone'
  | 'contact_email'
  | 'social_facebook'
  | 'social_instagram'
  | 'social_youtube'

type ConfigRow = { key: string; value: string }

// NB: named `useSiteSettings`, not `useSiteConfig` — the nuxt-site-config module
// already auto-imports a `useSiteConfig()` (site url/name/defaultLocale), and its
// definition wins the collision, so a composable of that name here resolves to
// the module's and blows up at the call site.
export async function useSiteSettings() {
  const { locale } = useI18n()
  const provider = useCmsProvider()

  // Never let this throw. Every call site has a fallback (the i18n copy that
  // shipped before these keys existed), so a CMS that is down — or simply has
  // not had directus/setup-configuration.mjs run against it yet — should degrade
  // to that fallback rather than error a page that is otherwise fine. The footer
  // renders on every route, so this is the whole site.
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
      // An empty value means "not set" (the social URLs ship empty), so it is
      // dropped here and callers get the fallback instead of an href="".
      if (row?.key && row.value) map.set(row.key, row.value)
    }
    return map
  })

  /**
   * Read one setting. Returns a computed so a caller can hold it across a
   * refetch; `fallback` covers both a missing key and an unset value.
   */
  function config(key: SiteConfigKey | (string & {}), fallback = '') {
    return computed(() => entries.value.get(key) ?? fallback)
  }

  return { entries, config }
}
