#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createHash } from 'node:crypto'
import { parse as parseYaml } from 'yaml'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
const DRY = process.argv.includes('--dry-run')
const ROOT = process.cwd()
const LOCALES = ['mn', 'en']

if (!TOKEN) {
  console.error('DIRECTUS_TOKEN is required (the read-only NUXT_CMS_TOKEN cannot write).')
  process.exit(1)
}

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

const bySlug = new Map()
for (const locale of LOCALES) {
  const dir = join(ROOT, 'content/branches', locale)
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    const doc = parseYaml(readFileSync(join(dir, f), 'utf8'))
    if (!bySlug.has(doc.slug)) bySlug.set(doc.slug, {})
    bySlug.get(doc.slug)[locale] = doc
  }
}

const fileCache = new Map()
const stats = { uploaded: 0, reused: 0, patched: 0, transPatched: 0, transCreated: 0 }

async function uploadImage(publicPath, label) {
  if (!publicPath) return null
  if (fileCache.has(publicPath)) return fileCache.get(publicPath)
  const diskPath = join(ROOT, 'public', publicPath.replace(/^\//, ''))
  if (!existsSync(diskPath)) {
    console.warn(`  ! ${label}: not on disk: ${publicPath}`)
    fileCache.set(publicPath, null)
    return null
  }
  const buf = readFileSync(diskPath)
  const tag = `sha256:${createHash('sha256').update(buf).digest('hex')}`

  const existing = await api('GET', `/files?filter[description][_eq]=${encodeURIComponent(tag)}&limit=1&fields=id`)
  if (existing?.length) {
    stats.reused++
    fileCache.set(publicPath, existing[0].id)
    return existing[0].id
  }
  if (DRY) {
    console.log(`  + would upload ${publicPath}`)
    stats.uploaded++
    fileCache.set(publicPath, null)
    return null
  }
  const form = new FormData()
  form.append('title', basename(publicPath))
  form.append('description', tag)
  form.append('file', new Blob([buf]), basename(publicPath))
  const file = await api('POST', '/files', form, true)
  console.log(`  + uploaded ${publicPath} -> ${file.id}`)
  stats.uploaded++
  fileCache.set(publicPath, file.id)
  return file.id
}

console.log(`\nSyncing branches -> ${BASE}${DRY ? ' (DRY RUN — no writes)' : ''}\n`)

for (const [slug, pair] of bySlug) {
  const mn = pair.mn
  if (!mn) {
    console.warn(`  ! ${slug}: no mn source, skipped`)
    continue
  }
  console.log(`[${slug}]`)

  const found = await api('GET', `/items/branches?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1&fields=id`)
  if (!found?.length) {
    console.warn(`  ! ${slug}: no such branch in Directus — create it there first, this script only updates`)
    continue
  }
  const id = found[0].id

  const payload = {
    order: mn.order ?? null,
    pin_x: mn.pin?.x ?? null,
    pin_y: mn.pin?.y ?? null,
    latitude: mn.coords?.lat ?? null,
    longitude: mn.coords?.lng ?? null,
  }
  const photo = await uploadImage(mn.photo, `${slug}.photo`)
  const mapImage = await uploadImage(mn.mapImage, `${slug}.mapImage`)
  if (photo) payload.photo = photo
  if (mapImage) payload.map_image = mapImage

  if (!DRY) await api('PATCH', `/items/branches/${id}`, payload)
  stats.patched++
  console.log(`  = base: order=${payload.order} coords=${payload.latitude},${payload.longitude}`)

  for (const locale of LOCALES) {
    const d = pair[locale]
    if (!d) continue
    const trans = {
      name: d.name,
      address: d.address,
      phone: d.phone ?? null,
      hours: d.hours ?? null,
      caption: d.caption ?? null,
    }
    if (DRY) {
      console.log(`  = ${locale}: ${trans.name} — ${trans.hours} — ${trans.address}`)
      stats.transPatched++
      continue
    }
    const rows = await api(
      'GET',
      `/items/branches_translations?filter[branches_id][_eq]=${id}&filter[languages_code][_eq]=${locale}&limit=1&fields=id`,
    )
    if (rows?.length) {
      await api('PATCH', `/items/branches_translations/${rows[0].id}`, trans)
      stats.transPatched++
    } else {
      await api('POST', '/items/branches_translations', { branches_id: id, languages_code: locale, ...trans })
      stats.transCreated++
    }
    console.log(`  = ${locale}: ${trans.name}`)
  }
}

console.log(`\nSummary${DRY ? ' (dry run)' : ''}:`)
console.log(`  files:        ${stats.uploaded} uploaded, ${stats.reused} reused (checksum)`)
console.log(`  base rows:    ${stats.patched} patched`)
console.log(`  translations: ${stats.transPatched} patched, ${stats.transCreated} created`)
if (!DRY) console.log('\nDirectus caches /api/cms for 60s — the site picks the change up after that.')
