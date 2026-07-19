// Allowlisted public CMS endpoint (plan §8). Only published content, only the
// seven known collections, only locale + single-record lookups — arbitrary
// Directus filters are rejected by construction. Responses cache for 60s with
// stale-while-revalidate; Cloudflare's edge adds stale-if-error on top.

const LOCALES = new Set(['mn', 'en'])

export default defineCachedEventHandler(
  async (event) => {
    const name = getRouterParam(event, 'collection') ?? ''
    const cfg = CMS_COLLECTIONS[name]
    if (!cfg) {
      throw createError({ statusCode: 404, statusMessage: 'Unknown collection' })
    }

    const q = getQuery(event)
    const locale = String(q.locale ?? '')
    if (!LOCALES.has(locale)) {
      throw createError({ statusCode: 400, statusMessage: 'locale must be mn or en' })
    }
    const single = q[cfg.param] ? String(q[cfg.param]) : null
    const limit = Math.min(Number(q.limit) || 100, 100)

    const query: Record<string, string | number> = {
      'filter[status][_eq]': 'published',
      fields: cfg.fields.join(','),
      limit: single ? 1 : limit,
    }
    if (single) query[`filter[${cfg.param}][_eq]`] = single
    if (cfg.sort) query.sort = cfg.sort

    const rows = await directusFetch<Record<string, any>[]>(`/items/${name}`, query)
    const asset = cmsAssetUrl
    const items = await Promise.all(rows.map((r) => cfg.normalize(r, locale, asset)))

    setResponseHeader(
      event,
      'Cache-Control',
      'public, max-age=0, s-maxage=60, stale-while-revalidate=600, stale-if-error=86400',
    )
    return single ? (items[0] ?? null) : items
  },
  {
    name: 'cms',
    maxAge: 60,
    staleMaxAge: 600,
    swr: true,
    getKey: (event) => {
      const q = getQuery(event)
      return `${getRouterParam(event, 'collection')}:${q.locale}:${q.slug ?? q.key ?? ''}:${q.limit ?? ''}`
    },
  },
)
