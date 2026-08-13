#!/usr/bin/env node
import { randomBytes } from 'node:crypto'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.text()) ? JSON.parse(await res.clone?.().text?.() ?? '{}') : {}
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json?.errors ?? json)}`)
  return json.data
}
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
const JUNCTIONS = { products_related: 'products_id', services_related: 'services_id' }

let policy = await findOne('/policies', 'name', 'API Read Policy')
if (!policy) {
  policy = await call('POST', '/policies', { name: 'API Read Policy', icon: 'visibility', app_access: false, admin_access: false })
  console.log('+ created API Read Policy')
} else console.log('= API Read Policy exists')

async function ensureRead(collection, permissions) {
  const existing = await call('GET', `/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=read&limit=1`)
  if (existing?.length) return console.log(`= read ${collection}`)
  await call('POST', '/permissions', { policy: policy.id, collection, action: 'read', fields: ['*'], permissions, validation: null, presets: null })
  console.log(`+ read ${collection}`)
}

for (const c of BASES) {
  await ensureRead(c, { status: { _eq: 'published' } })
  await ensureRead(`${c}_translations`, { [`${c}_id`]: { status: { _eq: 'published' } } })
}
for (const [j, parent] of Object.entries(JUNCTIONS)) {
  await ensureRead(j, { [parent]: { status: { _eq: 'published' } } })
}
await ensureRead('languages', null)
await ensureRead('directus_files', null)

let user = await findOne('/users', 'email', 'api-reader@finco.design')
if (!user) {
  const token = randomBytes(32).toString('hex')
  const role = await call('POST', '/roles', { name: 'API Reader', icon: 'api' }).catch(async () => await findOne('/roles', 'name', 'API Reader'))
  await call('POST', '/access', { role: role.id, policy: policy.id })
  user = await call('POST', '/users', { email: 'api-reader@finco.design', role: role.id, token, status: 'active' })
  console.log('+ created api-reader user')
  console.log('\nNUXT_CMS_TOKEN=' + token + '\n(shown once — put it in .env / Worker secrets)')
} else {
  console.log('= api-reader user exists (token unchanged; reset it in the admin if lost)')
}
