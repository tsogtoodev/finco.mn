const LOCALES = new Set(['mn', 'en'])

const getPublished = defineCachedFunction(
  async (name: string, locale: string, single: string | null, limit: number) => {
    const cfg = CMS_COLLECTIONS[name]!
    const query: Record<string, string | number> = {
      'filter[status][_eq]': 'published',
      fields: cfg.fields.join(','),
      limit: single ? 1 : limit,
    }
    if (single) query[`filter[${cfg.param}][_eq]`] = single
    if (cfg.sort) query.sort = cfg.sort

    const rows = await directusFetch<Record<string, any>[]>(`/items/${name}`, query)
    return Promise.all(rows.map((r) => cfg.normalize(r, locale, cmsAssetUrl)))
  },
  {
    name: 'cms',
    maxAge: 60,
    swr: false,
    getKey: (name, locale, single, limit) => `${name}:${locale}:${single ?? ''}:${limit}`,
  },
)

export default defineEventHandler(async (event) => {
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

  const preview = await getPreviewData(event)
  const previewHere = preview?.c === name ? preview : null

  if (previewHere) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  } else {
    setResponseHeader(
      event,
      'Cache-Control',
      'public, max-age=0, s-maxage=60, stale-while-revalidate=600, stale-if-error=86400',
    )
  }

  async function fetchPreviewItem() {
    const query: Record<string, string | number> = { fields: cfg!.fields.join(',') }
    if (previewHere!.v) query.version = previewHere!.v
    const row = await directusFetch<Record<string, any>>(
      `/items/${name}/${encodeURIComponent(previewHere!.id!)}`,
      query,
      { preview: true },
    ).catch(() => null)
    return row ? await cfg!.normalize(row, locale, cmsAssetUrl) : null
  }

  if (single && previewHere && previewHere.s === single) {
    const item = await fetchPreviewItem()
    if (item) return item
  }

  const items = await getPublished(name, locale, single, limit)
  if (single) return items[0] ?? null

  if (previewHere) {
    const draft = await fetchPreviewItem()
    if (draft) {
      const out = [...items]
      const idx = out.findIndex((i: any) => i[cfg.param] === (draft as any)[cfg.param])
      if (idx >= 0) out[idx] = draft
      else out.push(draft)
      return out
    }
  }
  return items
})
