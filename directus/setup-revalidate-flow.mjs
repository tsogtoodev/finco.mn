#!/usr/bin/env node
/**
 * Creates the "Purge site cache" Directus Flow (plan §8 revalidate webhook):
 * on any content create/update/delete it POSTs to the Nuxt revalidate
 * endpoint with the shared secret, purging the Worker CMS cache for that
 * collection. Publish latency then = Cloudflare edge TTL only (≤60s).
 * Idempotent. Uses 1 of Directus Core's 5 Flows.
 *
 * Usage:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=<admin> WEBHOOK_SECRET=<secret> \
 *   [SITE=https://finco.design] node directus/setup-revalidate-flow.mjs
 */
const B = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
const SECRET = process.env.WEBHOOK_SECRET
const SITE = (process.env.SITE ?? 'https://finco.design').replace(/\/$/, '')
if (!SECRET) {
  console.error('WEBHOOK_SECRET required')
  process.exit(1)
}

async function call(method, path, body) {
  const res = await fetch(B + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json?.errors?.map((e) => e.message).join('; ') ?? text}`)
  return json.data
}

const BASES = ['products', 'services', 'branches', 'jobs', 'news', 'legal', 'pages']
const COLLECTIONS = [...BASES, ...BASES.map((c) => `${c}_translations`), 'products_related', 'services_related']

const existing = (await call('GET', `/flows?filter[name][_eq]=${encodeURIComponent('Purge site cache')}&limit=1`))?.[0]
if (existing) {
  console.log('= flow "Purge site cache" exists (delete it in Settings > Flows to recreate)')
  process.exit(0)
}

const flow = await call('POST', '/flows', {
  name: 'Purge site cache',
  icon: 'published_with_changes',
  status: 'active',
  trigger: 'event',
  accountability: 'all',
  options: {
    type: 'action',
    scope: ['items.create', 'items.update', 'items.delete'],
    collections: COLLECTIONS,
  },
})
console.log('+ created flow', flow.id)

const op = await call('POST', '/operations', {
  flow: flow.id,
  name: 'POST revalidate',
  key: 'post_revalidate',
  type: 'request',
  position_x: 19,
  position_y: 1,
  options: {
    method: 'POST',
    url: `${SITE}/api/cms/revalidate`,
    headers: [
      { header: 'X-Webhook-Secret', value: SECRET },
      { header: 'Content-Type', value: 'application/json' },
    ],
    body: '{"collection":"{{$trigger.collection}}"}',
  },
})
await call('PATCH', `/flows/${flow.id}`, { operation: op.id })
console.log('+ wired request operation -> flow')
console.log(`\nDone. Every content change now POSTs to ${SITE}/api/cms/revalidate`)
