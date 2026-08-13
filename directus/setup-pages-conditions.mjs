#!/usr/bin/env node

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null

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
async function exists(path) {
  try {
    await api('GET', path)
    return true
  } catch {
    return false
  }
}
function log(step, msg) {
  console.log(`  ${step === 'skip' ? '=' : '+'} ${msg}`)
}

const T = 'pages_translations'

if (!token) {
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set DIRECTUS_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.')
    process.exit(1)
  }
  token = (await api('POST', '/auth/login', { email, password })).access_token
}
console.log(`\nPer-page form conditions on ${BASE}\n`)

const pageId = Object.fromEntries((await api('GET', '/items/pages?limit=-1&fields=id,key')).map((p) => [p.key, p.id]))
const missing = ['home', 'about', 'products', 'business', 'branches', 'careers'].filter((k) => !pageId[k])
if (missing.length) throw new Error(`pages records missing for keys: ${missing.join(', ')}`)

const onPages = (name, keys) => ({
  hidden: true,
  conditions: [
    {
      name,
      rule: { pages_id: { _in: keys.map((k) => pageId[k]) } },
      hidden: false,
    },
  ],
})

console.log('[groups]')
const GROUPS = [
  { field: 'home_group', note: 'Home page sections.', pages: ['home'] },
  { field: 'careers_group', note: 'Careers page sections.', pages: ['careers'] },
]
for (const g of GROUPS) {
  if (await exists(`/fields/${T}/${g.field}`)) log('skip', `${T}.${g.field} exists`)
  else {
    await api('POST', `/fields/${T}`, {
      field: g.field,
      type: 'alias',
      meta: {
        interface: 'group-detail',
        special: ['alias', 'no-data', 'group'],
        options: { start: 'open' },
        width: 'full',
        note: g.note,
      },
    })
    log('add', `${T}.${g.field}`)
  }
}

console.log('[layout]')
const LAYOUT = [
  { field: 'hero', meta: { sort: 10, ...onPages('non-about pages', ['home', 'products', 'business', 'branches', 'careers']) } },
  { field: 'faq', meta: { sort: 20, ...onPages('products + business', ['products', 'business']) } },

  { field: 'home_group', meta: { sort: 30, ...onPages('home only', ['home']) } },
  ...['hero_slides', 'stats', 'stats_heading', 'value_props', 'beep', 'fincobiz'].map((field, i) => ({
    field,
    meta: { group: 'home_group', sort: 31 + i, hidden: false, conditions: null },
  })),

  { field: 'careers_group', meta: { sort: 40, ...onPages('careers only', ['careers']) } },
  ...['perks', 'timeline'].map((field, i) => ({
    field,
    meta: { group: 'careers_group', sort: 41 + i, hidden: false, conditions: null },
  })),

  { field: 'about_group', meta: { sort: 50, ...onPages('about only', ['about']) } },

  ...['showcases', 'cta', 'leadership', 'team', 'sections'].map((field, i) => ({
    field,
    meta: {
      sort: 90 + i,
      hidden: true,
      conditions: null,
      note: 'RETIRED — no longer rendered by the site. Hidden from the form; data kept for rollback.',
    },
  })),
]

for (const { field, meta } of LAYOUT) {
  if (!(await exists(`/fields/${T}/${field}`))) {
    log('skip', `${T}.${field} does not exist — skipped`)
    continue
  }
  await api('PATCH', `/fields/${T}/${field}`, { meta })
  log('add', `${T}.${field}: ${meta.group ? `group=${meta.group}` : meta.conditions ? `visible on ${meta.conditions[0].name}` : 'hidden (retired)'}`)
}

console.log(`
Done. Refresh the Studio and open each Pages record:
  home     -> hero + Home page sections
  about    -> About page group only
  products -> hero + faq        business -> hero + faq
  branches -> hero              careers  -> hero + Careers page sections
`)
