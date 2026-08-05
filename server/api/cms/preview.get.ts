// Preview bootstrap (plan §7). Directus's Live Preview iframe opens this URL
// with the shared secret + collection/id(/version). We validate the secret,
// seal a 30-minute preview session cookie scoped to that one item, and
// redirect to the clean public route — the secret never appears in the final
// URL, and the CMS endpoint serves the draft only while the cookie is valid.
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
  // Directus leaves {{$version}} unreplaced ("") for the main version.
  const rawVersion = String(q.version ?? '')
  const version = rawVersion && rawVersion !== 'main' && !rawVersion.includes('{{') ? rawVersion : null

  // Look up the item (any status) with the preview token to resolve its slug/key.
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

  // Cache-bust the destination. Pages are cached as HTML for 300s (nuxt.config
  // routeRules), and that cache does NOT honour the `no-store` this handler and
  // cms-preview-headers set: nitro overwrites `Cache-Control` with its own
  // `max-age` and stores the entry regardless. Without a unique URL an editor
  // would keep seeing a snapshot of their draft for up to five minutes after
  // saving. The nonce puts every bootstrap on its own cache key — Directus
  // re-opens this endpoint each time it refreshes the preview iframe, so each
  // refresh renders fresh. `varies: ['cookie']` already keeps these entries off
  // the shared published key; this keeps them off each OTHER.
  const target = ROUTES[collection]!(String(item[cfg.param]), locale)
  return sendRedirect(event, `${target}?__preview=${Date.now().toString(36)}`, 302)
})
