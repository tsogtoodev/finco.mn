// Dynamic sitemap source — emits locale-prefixed URLs for content-driven
// detail routes (products, services, jobs, news) that @nuxtjs/sitemap can't
// discover from the static page tree. Registered via `sitemap.sources`.
export default defineSitemapEventHandler(async (event) => {
  const locales = ['mn', 'en'] as const
  const urls: { loc: string }[] = []
  // Wave-1 collections read Directus when the provider flag is on; drafts are
  // excluded upstream (the CMS endpoint only serves published records).
  const directus = useRuntimeConfig().public.cmsProvider === 'directus'

  for (const locale of locales) {
    const products = directus
      ? await $fetch<{ slug: string }[]>('/api/cms/products', { query: { locale } })
      : await queryCollection(event, 'products').where('locale', '=', locale).all()
    for (const p of products) urls.push({ loc: `/${locale}/products/${p.slug}` })

    const services = directus
      ? await $fetch<{ slug: string }[]>('/api/cms/services', { query: { locale } })
      : await queryCollection(event, 'services').where('locale', '=', locale).all()
    for (const s of services) urls.push({ loc: `/${locale}/services/${s.slug}` })

    const jobs = directus
      ? await $fetch<{ slug: string }[]>('/api/cms/jobs', { query: { locale } })
      : await queryCollection(event, 'jobs').where('locale', '=', locale).all()
    for (const j of jobs) urls.push({ loc: `/${locale}/careers/${j.slug}` })

    const news = directus
      ? await $fetch<{ slug: string }[]>('/api/cms/news', { query: { locale } })
      : await queryCollection(event, 'news').where('locale', '=', locale).all()
    for (const n of news) urls.push({ loc: `/${locale}/news/${n.slug}` })
  }

  return urls
})
