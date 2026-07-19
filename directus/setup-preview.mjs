#!/usr/bin/env node
/**
 * Live-preview provisioning (plan §7):
 *  1. "Preview Read Policy" + preview-reader user — can read ALL statuses
 *     (drafts included) and content versions. Server-only token; never public.
 *  2. Sets each collection's Live Preview URL to the Nuxt bootstrap endpoint,
 *     embedding the rotatable preview bootstrap secret.
 *
 * Idempotent. Prints NUXT_CMS_PREVIEW_TOKEN / NUXT_CMS_PREVIEW_SECRET once on
 * first creation — store them in .env + Worker secrets. Re-running keeps the
 * existing user token; pass ROTATE_SECRET=1 to mint + apply a fresh secret.
 *
 * Usage:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=<admin> [PREVIEW_SITE=https://finco.design] \
 *   [PREVIEW_SECRET=<existing>] node directus/setup-preview.mjs
 */
import { randomBytes } from 'node:crypto'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
const SITE = (process.env.PREVIEW_SITE ?? 'https://finco.design').replace(/\/$/, '')

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json?.errors?.map((e) => e.message).join('; ') ?? text}`)
  return json.data
}
const findOne = async (path, k, v) => (await call('GET', `${path}?filter[${k}][_eq]=${encodeURIComponent(v)}&limit=1`))?.[0] ?? null

const BASES = ['products', 'services', 'branches', 'jobs', 'news', 'legal', 'pages']
const JUNCTIONS = ['products_related', 'services_related']

// ---------------------------------------------------------------------------
// 1. Policy + permissions (read everything, any status)
// ---------------------------------------------------------------------------
let policy = await findOne('/policies', 'name', 'Preview Read Policy')
if (!policy) {
  policy = await call('POST', '/policies', { name: 'Preview Read Policy', icon: 'preview', app_access: false, admin_access: false })
  console.log('+ created Preview Read Policy')
} else console.log('= Preview Read Policy exists')

async function ensureRead(collection) {
  const existing = await call('GET', `/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=read&limit=1`)
  if (existing?.length) return console.log(`= read ${collection}`)
  await call('POST', '/permissions', { policy: policy.id, collection, action: 'read', fields: ['*'], permissions: null, validation: null, presets: null })
  console.log(`+ read ${collection}`)
}
for (const c of [...BASES, ...BASES.map((c) => `${c}_translations`), ...JUNCTIONS, 'languages', 'directus_files', 'directus_versions']) {
  await ensureRead(c)
}

// ---------------------------------------------------------------------------
// 2. preview-reader user + static token
// ---------------------------------------------------------------------------
let user = await findOne('/users', 'email', 'preview-reader@finco.design')
if (!user) {
  const token = randomBytes(32).toString('hex')
  let role = await findOne('/roles', 'name', 'Preview Reader')
  if (!role) role = await call('POST', '/roles', { name: 'Preview Reader', icon: 'preview' })
  const attached = await call('GET', `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&limit=1`)
  if (!attached?.length) await call('POST', '/access', { role: role.id, policy: policy.id })
  user = await call('POST', '/users', { email: 'preview-reader@finco.design', role: role.id, token, status: 'active' })
  console.log('+ created preview-reader user')
  console.log('\nNUXT_CMS_PREVIEW_TOKEN=' + token)
} else console.log('= preview-reader user exists (token unchanged)')

// ---------------------------------------------------------------------------
// 3. Bootstrap secret + per-collection Live Preview URLs
// ---------------------------------------------------------------------------
const secret = process.env.PREVIEW_SECRET || randomBytes(32).toString('hex')
if (!process.env.PREVIEW_SECRET) console.log('NUXT_CMS_PREVIEW_SECRET=' + secret + '\n(store both — shown once)')

for (const c of BASES) {
  const url = `${SITE}/api/cms/preview?secret=${secret}&collection=${c}&id={{id}}&version={{$version}}&locale=mn`
  await call('PATCH', `/collections/${c}`, { meta: { preview_url: url } })
  console.log(`+ preview_url set on ${c}`)
}

console.log(`
Done. Next:
  1. Put NUXT_CMS_PREVIEW_TOKEN + NUXT_CMS_PREVIEW_SECRET into .env and Worker secrets.
  2. Rotation: rerun with ROTATE/PREVIEW_SECRET unset to mint a new secret, then update the env everywhere.
  3. Editors: open any item -> the preview pane appears (enable it via the
     screen-split icon top-right of the item page).`)
