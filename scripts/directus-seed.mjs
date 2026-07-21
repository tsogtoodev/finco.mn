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
      // flattened (setup-flatten-json.mjs) — legacy loan_terms/tabs never written.
      // tabs.info is not seeded: body always shadows it on the detail page.
      loan_amount: d.loanTerms?.amount ?? null, loan_rate: d.loanTerms?.rate ?? null,
      loan_period: d.loanTerms?.period ?? null,
      tabs_requirements: wrapText(d.tabs?.requirements), tabs_other: d.tabs?.other ?? null,
      faq: d.faq ?? null,
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
      cta_label: d.cta?.label ?? null, cta_to: d.cta?.to ?? null, faq: d.faq ?? null,
    }),
    related: { junction: 'services_related', own: 'services_id', other: 'products_id', target: 'products' },
    bodyDropped: true,
  },
  branches: {
    key: 'slug',
    base: (d) => ({
      slug: d.slug, order: d.order ?? null,
      pin_x: d.pin?.x ?? null, pin_y: d.pin?.y ?? null,
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
      requirements: wrapText(d.requirements), responsibilities: wrapText(d.responsibilities),
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
    // hero/valueProps/beep/fincobiz/about ship as flattened fields
    // (setup-flatten-json.mjs / setup-about-restructure.mjs); the legacy JSON
    // columns may already be dropped, so never write them. showcases/cta/
    // leadership/team/sections are retired (no consumer) and not seeded.
    trans: async (d) => ({
      stats: d.stats ?? null, stats_heading: d.statsHeading ?? null,
      hero_slides: d.heroSlides ?? null,
      timeline: d.timeline ?? null, perks: d.perks ?? null,
      faq: d.faq ?? null,
      hero_eyebrow: d.hero?.eyebrow ?? null,
      hero_headline: d.hero?.headline ?? null,
      hero_accent: d.hero?.accent ?? null,
      hero_subheadline: d.hero?.subheadline ?? null,
      // relational upload (setup-image-fields.mjs) — path strings are legacy
      hero_image_file: await uploadImage(d.hero?.image, 'pages hero'),
      hero_cta_label: d.hero?.cta?.label ?? null,
      hero_cta_to: d.hero?.cta?.to ?? null,
      hero_secondary_cta_label: d.hero?.secondaryCta?.label ?? null,
      hero_secondary_cta_to: d.hero?.secondaryCta?.to ?? null,
      value_props_heading: d.valueProps?.heading ?? null,
      value_props_accent: d.valueProps?.accent ?? null,
      value_props_subheading: d.valueProps?.subheading ?? null,
      value_props_items: d.valueProps?.items ?? null,
      beep_heading: d.beep?.heading ?? null,
      beep_subtext: d.beep?.subtext ?? null,
      beep_expand_lead: d.beep?.expandLead ?? null,
      beep_expand_rest: d.beep?.expandRest ?? null,
      beep_teaser: d.beep?.teaser ?? null,
      fincobiz_subtext: d.fincobiz?.subtext ?? null,
      fincobiz_callout_heading: d.fincobiz?.calloutHeading ?? null,
      fincobiz_callout_subtext: d.fincobiz?.calloutSubtext ?? null,
      fincobiz_card_request: d.fincobiz?.cards?.request ?? null,
      fincobiz_card_receivables: d.fincobiz?.cards?.receivables ?? null,
      fincobiz_card_eligibility: d.fincobiz?.cards?.eligibility ?? null,
      ...(await explodeAbout(d.about)),
    }),
  },
}

// string[] -> repeater rows [{text}]
const wrapText = (arr) => arr?.map((s) => (typeof s === 'string' ? { text: s } : s)) ?? null

// content-file about blob -> flat about_* fields. Mirrors explode() in
// directus/setup-about-restructure.mjs and assembleAbout() in
// server/utils/cms-normalizers.ts — keep the three in sync. `align` on value
// items is intentionally dropped (dead since the AboutValues redesign).
async function explodeAbout(a) {
  if (!a) return {}
  return {
    about_hero_headline: a.hero?.headline ?? null,
    about_hero_intro: a.hero?.intro ?? null,
    about_hero_photo_file: await uploadImage(a.hero?.photo, 'about hero'),
    about_mission_blocks: a.mission?.blocks ?? null,
    about_values_heading_lead: a.values?.headingLead ?? null,
    about_values_heading_accent: a.values?.headingAccent ?? null,
    about_values_subheading: a.values?.subheading ?? null,
    about_values_items: a.values?.items?.map(({ title, body }) => ({ title, body })) ?? null,
    about_history_heading_lead: a.history?.headingLead ?? null,
    about_history_heading_accent: a.history?.headingAccent ?? null,
    about_history_subheading: a.history?.subheading ?? null,
    about_history_milestones: a.history?.milestones ?? null,
    about_ceo_heading_lead: a.ceo?.headingLead ?? null,
    about_ceo_heading_accent: a.ceo?.headingAccent ?? null,
    about_ceo_subheading: a.ceo?.subheading ?? null,
    about_ceo_greeting_title: a.ceo?.greetingTitle ?? null,
    about_ceo_greeting_body: a.ceo?.greetingBody?.join('\n\n') ?? null,
    about_ceo_tagline: a.ceo?.tagline ?? null,
    about_ceo_signature_label: a.ceo?.signatureLabel ?? null,
    about_ceo_signature_name: a.ceo?.signatureName ?? null,
    about_ceo_portrait_file: await uploadImage(a.ceo?.portrait, 'about ceo'),
    about_board_heading_lead: a.board?.headingLead ?? null,
    about_board_heading_accent: a.board?.headingAccent ?? null,
    about_board_members: a.board?.members
      ? await Promise.all(a.board.members.map(async (m) => ({ ...m, photo: (await uploadImage(m.photo, 'board member')) ?? m.photo })))
      : null,
    about_org_heading_lead: a.org?.headingLead ?? null,
    about_org_heading_accent: a.org?.headingAccent ?? null,
    about_org_subheading: a.org?.subheading ?? null,
    about_org_root: a.org?.root ?? null,
    about_org_ceo: a.org?.ceo ?? null,
    about_org_departments: a.org?.departments ?? null,
  }
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
      if (pair[locale]) await upsertTranslation(type, baseId, locale, await cfg.trans(pair[locale]))
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
