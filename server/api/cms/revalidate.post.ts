// Signed cache-revalidation webhook (plan §8). A Directus Flow POSTs here on
// every content create/update/delete; we purge the Worker-side cached CMS
// entries for that collection so the next request refetches. Cloudflare's
// 60-second edge TTL then bounds total publish latency (plan §12: ≤60s).
// Correctness never depends on this hook — the cache TTL remains the fallback.
import { timingSafeEqual } from 'node:crypto'

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().cmsWebhookSecret
  const given = getHeader(event, 'x-webhook-secret') ?? ''
  if (!secret || !given || !safeEqual(given, secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook credentials' })
  }

  const body = await readBody<{ collection?: string }>(event).catch(() => ({}) as { collection?: string })
  // Translation-table events map to their parent collection's cache keys.
  const collection = body.collection?.replace(/_translations$/, '')

  // Cached entries live under the cachedFunction group "cms"
  // (see getPublished in [collection].get.ts); keys start with the collection name.
  // Purge failures are non-fatal: the 60s TTL remains the correctness fallback
  // (plan §8), so never bounce an error back to the Directus Flow.
  try {
    const storage = useStorage('cache')
    const keys = await storage.getKeys('nitro:functions:cms:')
    const targets = keys.filter((k) => {
      if (!collection || !CMS_COLLECTIONS[collection]) return true // unknown/absent -> purge all cms keys
      return k.startsWith(`nitro:functions:cms:${collection}:`)
    })

    // Purging the DATA cache is not enough once pages are cached as HTML
    // (nuxt.config routeRules): a rendered page embeds the copy it was built
    // from, so a stale page entry would keep serving the old text for up to
    // its own TTL even though the CMS entry behind it is gone.
    //
    // Deliberately purge ALL page entries rather than just the edited item's
    // routes. A single product edit legitimately changes many pages — it is in
    // the mega menu and the footer catalog on EVERY page, plus the home
    // carousel, the listing grid and any related-products rail — so mapping an
    // item to "its" URLs would miss most of them. Publishes are rare and a
    // re-render is one request, so the blunt version is both cheaper to reason
    // about and more correct.
    const pageKeys = await storage.getKeys('nitro:routes:')
    await Promise.all([...targets, ...pageKeys].map((k) => storage.removeItem(k)))
    return { purged: targets.length, pages: pageKeys.length, collection: collection ?? 'all' }
  } catch (err) {
    console.warn('[cms/revalidate] purge failed, TTL fallback applies:', (err as Error).message)
    return { purged: -1, collection: collection ?? 'all', warning: 'purge failed; TTL fallback applies' }
  }
})
