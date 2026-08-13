import { timingSafeEqual } from 'node:crypto'

const ROUTES: Record<string, (slugOrKey: string, locale: string) => string> = {
  news: (s, l) => `/${l}/news/${s}`,
  products: (s, l) => `/${l}/products/${s}`,
  services: (s, l) => `/${l}/services/${s}`,
  jobs: (s, l) => `/${l}/careers/${s}`,
  legal: (s, l) => `/${l}/legal/${s}`,
  branches: (_s, l) => `/${l}/branches`,
  pages: (key, l) => {
    const map: Record<string, string> = { home: '', about: '/about', products: '/products', business: '/business', branches: '/branches', careers: '/careers' }
    return `/${l}${map[key] ?? ''}`
  },
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const q = getQuery(event)

  const secret = String(q.secret ?? '')
  if (!config.cmsPreviewSecret || !secret || !safeEqual(secret, config.cmsPreviewSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid preview credentials' })
  }

  const collection = String(q.collection ?? '')
  const cfg = CMS_COLLECTIONS[collection]
  if (!cfg) throw createError({ statusCode: 400, statusMessage: 'Unknown collection' })

  const id = String(q.id ?? '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const locale = ['mn', 'en'].includes(String(q.locale)) ? String(q.locale) : 'mn'
  const rawVersion = String(q.version ?? '')
  const version = rawVersion && rawVersion !== 'main' && !rawVersion.includes('{{') ? rawVersion : null

  const item = await directusFetch<Record<string, any>>(
    `/items/${collection}/${encodeURIComponent(id)}`,
    { fields: cfg.param },
    { preview: true },
  ).catch(() => null)
  if (!item?.[cfg.param]) throw createError({ statusCode: 404, statusMessage: 'Item not found' })

  const session = await previewSession(event)
  if (!session) throw createError({ statusCode: 503, statusMessage: 'Preview not configured' })
  await (await session).update({ c: collection, id, s: String(item[cfg.param]), v: version })

  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')

  const target = ROUTES[collection]!(String(item[cfg.param]), locale)
  return sendRedirect(event, `${target}?__preview=${Date.now().toString(36)}`, 302)
})
