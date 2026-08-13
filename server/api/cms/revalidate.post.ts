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
  const collection = body.collection?.replace(/_translations$/, '')

  try {
    const storage = useStorage('cache')
    const keys = await storage.getKeys('nitro:functions:cms:')
    const targets = keys.filter((k) => {
      if (!collection || !CMS_COLLECTIONS[collection]) return true
      return k.startsWith(`nitro:functions:cms:${collection}:`)
    })

    const pageKeys = await storage.getKeys('nitro:routes:')
    await Promise.all([...targets, ...pageKeys].map((k) => storage.removeItem(k)))
    return { purged: targets.length, pages: pageKeys.length, collection: collection ?? 'all' }
  } catch (err) {
    console.warn('[cms/revalidate] purge failed, TTL fallback applies:', (err as Error).message)
    return { purged: -1, collection: collection ?? 'all', warning: 'purge failed; TTL fallback applies' }
  }
})
