#!/usr/bin/env node

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const token = process.env.DIRECTUS_TOKEN
const FORCE = process.argv.includes('--force')
const DROP = process.argv.includes('--drop-legacy')

const T = 'pages_translations'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SLIDE_FIELDS = [
  { key: 'fincoBiz', field: 'hero_slide_fincobiz_file', label: 'FincoBiz', sort: 32 },
  { key: 'beepWallet', field: 'hero_slide_beepwallet_file', label: 'BeepWallet', sort: 33 },
  { key: 'loans', field: 'hero_slide_loans_file', label: 'Loans', sort: 34 },
  { key: 'trust', field: 'hero_slide_trust_file', label: 'Trust', sort: 35 },
]
const GROUP = 'home_group'

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
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

if (!token) {
  console.error('Set DIRECTUS_TOKEN (admin static token).')
  process.exit(1)
}
console.log(`\nRelational hero-slide images on ${BASE}\n`)

console.log('[fields]')
for (const { field, label, sort } of SLIDE_FIELDS) {
  if (await exists(`/fields/${T}/${field}`)) {
    log('skip', `${field} exists`)
    continue
  }
  await api('POST', `/fields/${T}`, {
    field,
    type: 'uuid',
    meta: {
      interface: 'file-image',
      special: ['file'],
      width: 'half',
      group: GROUP,
      sort,
      note: `${label} slide background (1440x737). Stored in R2. Leave empty to use the built-in art.`,
    },
    schema: {},
  })
  await api('POST', '/relations', {
    collection: T,
    field,
    related_collection: 'directus_files',
    schema: { on_delete: 'SET NULL' },
  })
  log('add', `${field} (+ relation to directus_files)`)
}

console.log('[migrate]')
const fieldNames = SLIDE_FIELDS.map((x) => x.field)
const rows = await api(
  'GET',
  `/items/${T}?limit=-1&fields=id,languages_code,hero_slides,${fieldNames.join(',')}`,
)
for (const row of rows) {
  const label = `${T}#${row.id} (${row.languages_code})`
  const slides = Array.isArray(row.hero_slides) ? row.hero_slides : []
  const patch = {}
  for (const { key, field } of SLIDE_FIELDS) {
    const legacy = slides.find((s) => s?.key === key)?.image
    if (typeof legacy !== 'string' || !UUID_RE.test(legacy)) continue
    if (row[field] && !FORCE) continue
    if (row[field] !== legacy) patch[field] = legacy
  }
  if (Object.keys(patch).length) {
    await api('PATCH', `/items/${T}/${row.id}`, patch)
    log('add', `${label}: linked ${Object.keys(patch).join(', ')}`)
  } else {
    log('skip', `${label}: nothing to migrate`)
  }
}

{
  const f = await api('GET', `/fields/${T}/hero_slides`)
  const options = f.meta?.options ?? {}
  const fields = options.fields ?? []
  if (fields.some((x) => x.field === 'image')) {
    await api('PATCH', `/fields/${T}/hero_slides`, {
      meta: { options: { ...options, fields: fields.filter((x) => x.field !== 'image') } },
    })
    log('add', 'hero_slides.image subfield removed from the repeater UI')
  } else {
    log('skip', 'hero_slides repeater has no image subfield')
  }
}

if (DROP) {
  console.log('[drop-legacy]')
  for (const row of rows) {
    const slides = Array.isArray(row.hero_slides) ? row.hero_slides : []
    if (!slides.some((s) => s && 'image' in s)) {
      log('skip', `${T}#${row.id}: no legacy image keys`)
      continue
    }
    const cleaned = slides.map((s) => {
      if (!s || !('image' in s)) return s
      const { image: _drop, ...rest } = s
      return rest
    })
    await api('PATCH', `/items/${T}/${row.id}`, { hero_slides: cleaned })
    log('add', `${T}#${row.id}: legacy image keys stripped`)
  }
}

console.log(`
Done. Next:
  1. Studio: pages -> home — four "<slide> slide background" pickers with
     thumbnails sit under Hero slides; the repeater rows are copy-only now.
  2. Deploy the app (normalizer prefers the new columns, falls back to any
     legacy repeater uuid until --drop-legacy).
  3. Verify prod, then re-run with --drop-legacy.
  4. make snapshot-directus  -> commit directus/schema.yaml
`)
