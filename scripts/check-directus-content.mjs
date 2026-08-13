#!/usr/bin/env node

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
if (!TOKEN) {
  console.error('DIRECTUS_TOKEN is required (admin or preview-reader token).')
  process.exit(1)
}

const errors = []
const warnings = []
const LOCALES = ['mn', 'en']
const STATUSES = new Set(['draft', 'published', 'archived'])
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PAGE_KEYS = ['home', 'about', 'products', 'business', 'branches', 'careers']

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${TOKEN}` } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${json?.errors?.map((e) => e.message).join('; ')}`)
  return json.data
}
const all = (collection, fields) => get(`/items/${collection}?limit=-1&fields=${fields.join(',')}`)
const blank = (v) => v == null || String(v).trim() === ''

const SPECS = {
  products: {
    param: 'slug',
    files: ['hero_image', 'card_image'],
    requiredTr: ['title'],
    extra: (r, label) => {
      if (!['individual', 'business'].includes(r.audience)) errors.push(`${label}: audience "${r.audience}" invalid`)
      if (typeof r.order !== 'number') errors.push(`${label}: missing numeric order`)
    },
    baseFields: ['audience', 'order'],
  },
  services: { param: 'slug', files: ['hero_image'], requiredTr: ['title'], baseFields: ['order'] },
  branches: {
    param: 'slug',
    files: ['photo', 'map_image'],
    requiredTr: ['name', 'address'],
    extra: (r, label) => {
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number')
        errors.push(`${label}: latitude/longitude must be numeric`)
    },
    baseFields: ['latitude', 'longitude'],
  },
  jobs: { param: 'slug', files: [], requiredTr: ['title'], baseFields: [] },
  news: {
    param: 'slug',
    files: ['image'],
    requiredTr: ['title', 'summary', 'body'],
    extra: (r, label) => {
      if (blank(r.published_at) || Number.isNaN(Date.parse(r.published_at)))
        errors.push(`${label}: published_at "${r.published_at}" is not a valid date`)
    },
    baseFields: ['published_at'],
  },
  legal: { param: 'slug', files: [], requiredTr: ['title', 'body'], baseFields: [] },
  pages: { param: 'key', files: [], requiredTr: [], baseFields: [] },
}

const langs = (await all('languages', ['code'])).map((l) => l.code).sort()
if (langs.join(',') !== 'en,mn') errors.push(`languages: expected exactly [en, mn], got [${langs.join(', ')}]`)

const fileIds = new Set((await get('/files?limit=-1&fields=id')).map((f) => f.id))

const counts = {}
const productStatusBySlug = new Map()
const productIdStatus = new Map()

for (const [name, spec] of Object.entries(SPECS)) {
  const fields = [
    'id', 'status', spec.param, ...spec.baseFields, ...spec.files,
    'translations.languages_code', ...spec.requiredTr.map((f) => `translations.${f}`),
  ]
  const rows = await all(name, fields)
  counts[name] = { total: rows.length, published: rows.filter((r) => r.status === 'published').length }

  const seen = new Map()
  for (const r of rows) {
    const key = r[spec.param]
    const label = `${name}/${key ?? r.id}`

    if (blank(key)) errors.push(`${label}: empty ${spec.param}`)
    else {
      if (seen.has(key)) errors.push(`${name}: duplicate ${spec.param} "${key}"`)
      seen.set(key, r)
      if (spec.param === 'slug' && !SLUG_RE.test(key)) errors.push(`${label}: slug is not URL-safe`)
      if (spec.param === 'key' && !PAGE_KEYS.includes(key)) errors.push(`${label}: unknown page key`)
    }

    if (!STATUSES.has(r.status)) errors.push(`${label}: invalid status "${r.status}"`)

    const perLocale = Object.fromEntries(LOCALES.map((l) => [l, r.translations?.filter((t) => t.languages_code === l) ?? []]))
    for (const l of LOCALES) {
      if (perLocale[l].length === 0) errors.push(`${label}: missing ${l} translation`)
      if (perLocale[l].length > 1) errors.push(`${label}: ${perLocale[l].length} ${l} translations (must be 1)`)
    }
    const strays = r.translations?.filter((t) => !LOCALES.includes(t.languages_code)) ?? []
    if (strays.length) errors.push(`${label}: translation with unknown language "${strays[0].languages_code}"`)

    for (const l of LOCALES) {
      const t = perLocale[l][0]
      if (!t) continue
      for (const f of spec.requiredTr) {
        if (blank(t[f])) errors.push(`${label}: ${l} translation missing ${f}`)
      }
    }

    for (const f of spec.files) {
      if (r[f] && !fileIds.has(r[f])) errors.push(`${label}: ${f} references missing file ${r[f]}`)
    }

    spec.extra?.(r, label)

    if (name === 'products') {
      productStatusBySlug.set(key, r.status)
      productIdStatus.set(r.id, { slug: key, status: r.status })
    }
  }

  if (spec.param === 'key') {
    for (const k of PAGE_KEYS) if (!seen.has(k)) errors.push(`pages: missing record for key "${k}"`)
  }
}

{
  const rows = await all('products', ['slug', 'audience', 'order', 'status'])
  const byAud = {}
  for (const r of rows.filter((x) => x.status === 'published')) {
    ;(byAud[r.audience] ??= new Map())
    const prev = byAud[r.audience].get(r.order)
    if (prev) warnings.push(`products: "${prev}" and "${r.slug}" share order ${r.order} (${r.audience})`)
    byAud[r.audience].set(r.order, r.slug)
  }
}

{
  const SCALARS = [
    'about_hero_headline', 'about_hero_intro', 'about_hero_photo_file',
    'about_values_heading_lead', 'about_values_heading_accent', 'about_values_subheading',
    'about_history_heading_lead', 'about_history_heading_accent', 'about_history_subheading',
    'about_ceo_heading_lead', 'about_ceo_heading_accent', 'about_ceo_subheading',
    'about_ceo_greeting_title', 'about_ceo_greeting_body', 'about_ceo_tagline',
    'about_ceo_signature_label', 'about_ceo_signature_name', 'about_ceo_portrait_file',
    'about_board_heading_lead', 'about_board_heading_accent',
    'about_org_heading_lead', 'about_org_heading_accent', 'about_org_subheading',
    'about_org_root', 'about_org_ceo',
  ]
  const REPEATERS = {
    about_mission_blocks: ['badge', 'heading', 'body'],
    about_values_items: ['title', 'body'],
    about_history_milestones: ['year', 'body'],
    about_board_members: ['name', 'role', 'bio', 'photo'],
    about_org_departments: null,
  }
  try {
    const rows = await get(
      `/items/pages?filter[key][_eq]=about&fields=translations.languages_code,${[...SCALARS, ...Object.keys(REPEATERS)].map((x) => `translations.${x}`).join(',')}`,
    )
    for (const l of LOCALES) {
      const t = rows?.[0]?.translations?.find((x) => x.languages_code === l)
      const label = `pages/about (${l})`
      if (!t) continue
      for (const f of SCALARS) if (blank(t[f])) errors.push(`${label}: missing ${f}`)
      for (const [f, keys] of Object.entries(REPEATERS)) {
        const v = t[f]
        if (!Array.isArray(v) || v.length === 0) {
          errors.push(`${label}: ${f} must be a non-empty array`)
          continue
        }
        if (keys) {
          v.forEach((item, i) => {
            for (const k of keys) if (blank(item?.[k])) errors.push(`${label}: ${f}[${i}] missing ${k}`)
          })
        } else if (v.some((s) => typeof s !== 'string' || blank(s))) {
          errors.push(`${label}: ${f} must contain non-empty strings`)
        }
      }
    }
  } catch {
    warnings.push('pages/about: about_* fields not found — setup-about-restructure.mjs not applied yet, skipping structure checks')
  }
}

for (const [junction, ownColl, ownField, otherField] of [
  ['products_related', 'products', 'products_id', 'related_products_id'],
  ['services_related', 'services', 'services_id', 'products_id'],
]) {
  const rows = await all(junction, ['id', `${ownField}.${SPECS[ownColl].param}`, `${ownField}.status`, `${otherField}.slug`, `${otherField}.status`])
  for (const r of rows) {
    const owner = r[ownField]
    const target = r[otherField]
    if (!owner || !target) {
      errors.push(`${junction}#${r.id}: dangling relation (owner or target missing)`)
      continue
    }
    if (owner.status === 'published' && target.status !== 'published')
      warnings.push(`${junction}: published ${ownColl}/"${owner[SPECS[ownColl].param]}" relates to ${target.status} product "${target.slug}" (won't render)`)
  }
}

console.log(
  'counts: ' +
    Object.entries(counts)
      .map(([c, n]) => `${c} ${n.published}/${n.total}`)
      .join(', ') +
    '  (published/total)',
)
if (warnings.length) {
  console.warn(`⚠ warnings (${warnings.length}):`)
  for (const w of warnings) console.warn(`  - ${w}`)
}
if (errors.length) {
  console.error(`✗ directus content check failed (${errors.length}):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('✓ directus content check passed: parity, slugs, status, required fields, relations, files')
