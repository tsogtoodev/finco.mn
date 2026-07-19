#!/usr/bin/env node
/**
 * One-time (but idempotent) importer: content/ files -> Directus.
 * Plan §9: parses all 70 source files, creates base records once per shared
 * slug/key, attaches mn+en translations, uploads file-field images to R2
 * (deduplicated by sha256), resolves related-product slugs in a second pass.
 *
 * - Idempotent: base records upserted by slug/key, translations by (base, locale),
 *   files deduped by checksum tag, junction rows by pair. Re-runs never duplicate.
 * - Imports as DRAFTS (status untouched on update). Use --publish after validation.
 * - JSON-embedded image paths (pages hero.image, team avatars, …) are left as
 *   strings — those assets stay in public/ per the plan's decorative/content split.
 * - Markdown bodies on `type: data` collections (products, services) have no
 *   Directus field; they are reported as warnings, never silently dropped.
 *
 * Usage:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node scripts/directus-seed.mjs --dry-run
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node scripts/directus-seed.mjs
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node scripts/directus-seed.mjs --publish
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { parse as parseYaml } from 'yaml'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
const DRY = process.argv.includes('--dry-run')
const PUBLISH = process.argv.includes('--publish')
const ROOT = process.cwd()
const LOCALES = ['mn', 'en']

if (!TOKEN) {
  console.error('DIRECTUS_TOKEN is required.')
  process.exit(1)
}

const warnings = []
const errors = []
const stats = { created: 0, updated: 0, transCreated: 0, transUpdated: 0, filesUploaded: 0, filesReused: 0, junctions: 0 }

async function api(method, path, body, isForm = false) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') ?? text
    throw new Error(`${method} ${path} -> ${res.status}: ${msg}`)
  }
  return json.data
}

// ---------------------------------------------------------------------------
// Type configs: source field names (camelCase) -> Directus fields (snake_case)
// ---------------------------------------------------------------------------
const TYPES = {
  products: {
    key: 'slug',
    base: (d) => ({ slug: d.slug, audience: d.audience, featured: d.featured ?? false, order: d.order ?? null }),
    files: { heroImage: 'hero_image', cardImage: 'card_image' },
    trans: (d) => ({
      title: d.title, menu_title: d.menuTitle ?? null, menu_desc: d.menuDesc ?? null,
      summary: d.summary ?? null, category: d.category ?? null,
      loan_terms: d.loanTerms ?? null, tabs: d.tabs ?? null, faq: d.faq ?? null,
      body: d._body || null, // rendered as the "info" tab on product detail
    }),
    related: { junction: 'products_related', own: 'products_id', other: 'related_products_id', target: 'products' },
  },
  services: {
    key: 'slug',
    base: (d) => ({ slug: d.slug, order: d.order ?? null }),
    files: { heroImage: 'hero_image' },
    trans: (d) => ({
      title: d.title, breadcrumb: d.breadcrumb ?? null, summary: d.summary ?? null,
      cta: d.cta ?? null, faq: d.faq ?? null,
    }),
    related: { junction: 'services_related', own: 'services_id', other: 'products_id', target: 'products' },
    bodyDropped: true,
  },
  branches: {
    key: 'slug',
    base: (d) => ({
      slug: d.slug, order: d.order ?? null, pin: d.pin ?? null,
      latitude: d.coords?.lat ?? null, longitude: d.coords?.lng ?? null,
    }),
    files: { photo: 'photo', mapImage: 'map_image' },
    trans: (d) => ({
      name: d.name, address: d.address, phone: d.phone ?? null,
      hours: d.hours ?? null, caption: d.caption ?? null,
    }),
    required: (d) => (d.coords?.lat == null || d.coords?.lng == null ? 'missing coords' : null),
  },
  jobs: {
    key: 'slug',
    base: (d) => ({ slug: d.slug, posted_at: d.postedAt ?? null }),
    files: {},
    trans: (d) => ({
      title: d.title, department: d.department ?? null, location: d.location ?? null,
      employment_type: d.type ?? null, summary: d.summary ?? null,
      requirements: d.requirements ?? null, responsibilities: d.responsibilities ?? null,
      application_sections: d.applicationSections ?? null,
    }),
  },
  news: {
    key: 'slug',
    base: (d) => ({ slug: d.slug, published_at: d.publishedAt, external_url: d.to ?? null }),
    files: { image: 'image' },
    trans: (d) => ({ title: d.title, summary: d.summary ?? '', body: d._body ?? '' }),
    required: (d) => (!d.publishedAt ? 'missing publishedAt' : !d._body ? 'missing markdown body' : null),
  },
  legal: {
    key: 'slug',
    base: (d) => ({ slug: d.slug, updated_at: d.updatedAt ?? null }),
    files: {},
    trans: (d) => ({ title: d.title, summary: d.summary ?? null, body: d._body ?? '' }),
    required: (d) => (!d._body ? 'missing markdown body' : null),
  },
  pages: {
    key: 'key',
    base: (d) => ({ key: d.key }),
    files: {},
    trans: (d) => ({
      hero: d.hero ?? null, stats: d.stats ?? null, stats_heading: d.statsHeading ?? null,
      value_props: d.valueProps ?? null, hero_slides: d.heroSlides ?? null,
      beep: d.beep ?? null, fincobiz: d.fincobiz ?? null, showcases: d.showcases ?? null,
      cta: d.cta ?? null, timeline: d.timeline ?? null, perks: d.perks ?? null,
      leadership: d.leadership ?? null, team: d.team ?? null, sections: d.sections ?? null,
      faq: d.faq ?? null, about: d.about ?? null,
    }),
  },
}

// ---------------------------------------------------------------------------
// Parse content files
// ---------------------------------------------------------------------------
function parseFile(path) {
  const raw = readFileSync(path, 'utf8')
  if (path.endsWith('.md')) {
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (!m) throw new Error(`no frontmatter: ${path}`)
    return { ...parseYaml(m[1]), _body: m[2].trim() }
  }
  return { ...parseYaml(raw), _body: '' }
}

function loadType(type) {
  const cfg = TYPES[type]
  const byKey = new Map()
  for (const locale of LOCALES) {
    const dir = join(ROOT, 'content', type, locale)
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir).sort()) {
      if (!/\.(md|ya?ml)$/.test(file)) continue
      const doc = parseFile(join(dir, file))
      const key = doc[cfg.key]
      const fnameKey = basename(file, extname(file))
      if (key !== fnameKey) warnings.push(`${type}/${locale}/${file}: ${cfg.key} "${key}" ≠ filename`)
      if (doc.locale !== locale) errors.push(`${type}/${locale}/${file}: locale field "${doc.locale}" ≠ folder`)
      if (cfg.required) {
        const problem = cfg.required(doc)
        if (problem) errors.push(`${type}/${locale}/${file}: ${problem}`)
      }
      if (cfg.bodyDropped && doc._body) {
        warnings.push(`${type}/${locale}/${file}: markdown body has no Directus field (dropped) — ${doc._body.slice(0, 50)}…`)
      }
      if (!byKey.has(key)) byKey.set(key, {})
      byKey.get(key)[locale] = doc
    }
  }
  for (const [key, pair] of byKey) {
    for (const locale of LOCALES) {
      if (!pair[locale]) errors.push(`${type}/${key}: missing ${locale} translation (parity)`)
    }
  }
  return byKey
}

// ---------------------------------------------------------------------------
// File upload with checksum dedup
// ---------------------------------------------------------------------------
const fileCache = new Map() // public path -> directus file id

async function uploadImage(publicPath, typeLabel) {
  if (!publicPath) return null
  if (fileCache.has(publicPath)) return fileCache.get(publicPath)
  const diskPath = join(ROOT, 'public', publicPath.replace(/^\//, ''))
  if (!existsSync(diskPath)) {
    warnings.push(`${typeLabel}: image not found on disk: ${publicPath}`)
    fileCache.set(publicPath, null)
    return null
  }
  const buf = readFileSync(diskPath)
  const hash = createHash('sha256').update(buf).digest('hex')
  const tag = `sha256:${hash}`

  const existing = await api('GET', `/files?filter[description][_eq]=${encodeURIComponent(tag)}&limit=1&fields=id`)
  if (existing?.length) {
    stats.filesReused++
    fileCache.set(publicPath, existing[0].id)
    return existing[0].id
  }
  if (DRY) {
    stats.filesUploaded++
    fileCache.set(publicPath, `(dry:${basename(publicPath)})`)
    return null
  }
  const form = new FormData()
  form.append('title', basename(publicPath))
  form.append('description', tag) // checksum key for idempotent dedup
  form.append('file', new Blob([buf]), basename(publicPath))
  const file = await api('POST', '/files', form, true)
  stats.filesUploaded++
  fileCache.set(publicPath, file.id)
  return file.id
}

// ---------------------------------------------------------------------------
// Upserts
// ---------------------------------------------------------------------------
function firstLocaleValue(pair, pick, label) {
  // Base fields must agree between locales; mn wins, divergence is warned.
  const mnVal = JSON.stringify(pick(pair.mn) ?? null)
  const enVal = JSON.stringify(pick(pair.en) ?? null)
  if (pair.mn && pair.en && mnVal !== enVal) warnings.push(`${label}: base field differs between locales; using mn (${mnVal} vs ${enVal})`)
  return pick(pair.mn ?? pair.en)
}

async function upsertBase(type, key, payload) {
  const cfg = TYPES[type]
  const found = await api('GET', `/items/${type}?filter[${cfg.key}][_eq]=${encodeURIComponent(key)}&limit=1&fields=id`)
  if (found?.length) {
    if (!DRY) await api('PATCH', `/items/${type}/${found[0].id}`, payload) // status untouched
    stats.updated++
    return found[0].id
  }
  if (DRY) {
    stats.created++
    return `(dry:${type}/${key})`
  }
  const created = await api('POST', `/items/${type}`, payload) // status defaults to draft
  stats.created++
  return created.id
}

async function upsertTranslation(type, baseId, locale, payload) {
  if (DRY) {
    stats.transCreated++
    return
  }
  const found = await api(
    'GET',
    `/items/${type}_translations?filter[${type}_id][_eq]=${baseId}&filter[languages_code][_eq]=${locale}&limit=1&fields=id`,
  )
  if (found?.length) {
    await api('PATCH', `/items/${type}_translations/${found[0].id}`, payload)
    stats.transUpdated++
  } else {
    await api('POST', `/items/${type}_translations`, { [`${type}_id`]: baseId, languages_code: locale, ...payload })
    stats.transCreated++
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`\nSeeding ${BASE} ${DRY ? '(DRY RUN — no writes)' : ''}\n`)

const loaded = {}
for (const type of Object.keys(TYPES)) loaded[type] = loadType(type)

const totalDocs = Object.values(loaded).reduce((n, m) => n + [...m.values()].reduce((x, p) => x + Object.keys(p).length, 0), 0)
console.log(`Parsed ${totalDocs} source documents across ${Object.keys(TYPES).length} types.`)

if (errors.length) {
  console.error(`\nVALIDATION FAILED (${errors.length}):`)
  errors.forEach((e) => console.error('  ✗ ' + e))
  process.exit(1)
}

const idsByType = {} // type -> Map(slug -> id)
const relatedTodo = [] // { type, baseId, slugs }

for (const [type, byKey] of Object.entries(loaded)) {
  const cfg = TYPES[type]
  console.log(`[${type}] ${byKey.size} records`)
  idsByType[type] = new Map()

  for (const [key, pair] of byKey) {
    const label = `${type}/${key}`
    const payload = firstLocaleValue(pair, (d) => (d ? cfg.base(d) : null), label)

    // file fields (base-level; mn path wins on divergence)
    for (const [srcField, dbField] of Object.entries(cfg.files)) {
      const path = firstLocaleValue(pair, (d) => d?.[srcField] ?? null, `${label}.${srcField}`)
      payload[dbField] = await uploadImage(path, label)
    }

    const baseId = await upsertBase(type, key, payload)
    idsByType[type].set(key, baseId)

    for (const locale of LOCALES) {
      if (pair[locale]) await upsertTranslation(type, baseId, locale, cfg.trans(pair[locale]))
    }

    if (cfg.related) {
      const slugs = firstLocaleValue(pair, (d) => d?.related ?? null, `${label}.related`)
      if (slugs?.length) relatedTodo.push({ type, key, baseId, slugs })
    }
  }
}

// second pass: related-product junctions
console.log('[relations] second pass')
for (const { type, key, baseId, slugs } of relatedTodo) {
  const cfg = TYPES[type].related
  for (const slug of slugs) {
    const targetId = idsByType[cfg.target].get(slug)
    if (!targetId) {
      warnings.push(`${type}/${key}: related slug "${slug}" not found in ${cfg.target}`)
      continue
    }
    if (DRY) {
      stats.junctions++
      continue
    }
    const found = await api(
      'GET',
      `/items/${cfg.junction}?filter[${cfg.own}][_eq]=${baseId}&filter[${cfg.other}][_eq]=${targetId}&limit=1&fields=id`,
    )
    if (!found?.length) {
      await api('POST', `/items/${cfg.junction}`, { [cfg.own]: baseId, [cfg.other]: targetId })
      stats.junctions++
    }
  }
}

// optional publish pass
if (PUBLISH && !DRY) {
  console.log('[publish] setting status=published on all seeded records')
  for (const [type, ids] of Object.entries(idsByType)) {
    for (const id of ids.values()) {
      await api('PATCH', `/items/${type}/${id}`, { status: 'published' })
    }
  }
}

// ---------------------------------------------------------------------------
console.log(`
Summary${DRY ? ' (dry run)' : ''}:
  base records:   ${stats.created} created, ${stats.updated} updated
  translations:   ${stats.transCreated} created, ${stats.transUpdated} updated
  files:          ${stats.filesUploaded} uploaded, ${stats.filesReused} reused (checksum)
  junction rows:  ${stats.junctions} ensured
  ${PUBLISH && !DRY ? 'status:         all seeded records PUBLISHED' : 'status:         drafts (run with --publish after validation)'}`)

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`)
  warnings.forEach((w) => console.log('  ⚠ ' + w))
}
