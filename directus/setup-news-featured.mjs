#!/usr/bin/env node

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const slugArg = process.argv.find((a) => a.startsWith('--slugs'))
const SLUGS = (slugArg?.split('=')[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') ?? text
    throw new Error(`${method} ${path} -> ${res.status}: ${msg}`)
  }
  return json.data
}
const log = (step, msg) => console.log(`  ${step === 'skip' ? '=' : '+'} ${msg}`)

const FIELD = {
  field: 'featured',
  type: 'boolean',
  meta: {
    interface: 'boolean',
    width: 'half',
    sort: 5,
    note: 'Shown in the "Онцлох" block on the news index. Up to 3; the rest fill with the latest articles.',
  },
  schema: { default_value: false },
}

if (!token) {
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set DIRECTUS_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.')
    process.exit(1)
  }
  token = (await api('POST', '/auth/login', { email, password })).access_token
}
console.log(`\nnews.featured on ${BASE}\n`)

let exists = true
try {
  await api('GET', '/fields/news/featured')
} catch {
  exists = false
}

if (exists) log('skip', 'news.featured already exists')
else {
  await api('POST', '/fields/news', FIELD)
  log('add', 'field news.featured (boolean, default false)')
}

const rows = await api('GET', '/items/news?limit=-1&fields=id,slug,featured')
const nulls = rows.filter((r) => r.featured == null)
for (const r of nulls) await api('PATCH', `/items/news/${r.id}`, { featured: false })
log(nulls.length ? 'add' : 'skip', `${nulls.length} rows normalised to false`)

for (const slug of SLUGS) {
  const row = rows.find((r) => r.slug === slug)
  if (!row) {
    console.error(`  ! no news article with slug "${slug}"`)
    continue
  }
  await api('PATCH', `/items/news/${row.id}`, { featured: true })
  log('add', `flagged ${slug}`)
}

const after = await api('GET', '/items/news?limit=-1&fields=slug,featured&filter[featured][_eq]=true')
console.log(`\n✓ done — ${after.length} article(s) flagged${after.length ? `: ${after.map((r) => r.slug).join(', ')}` : ' (block falls back to the 3 latest)'}\n`)
