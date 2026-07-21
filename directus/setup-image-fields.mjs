#!/usr/bin/env node
/**
 * Real image uploads for the fields that were labeled "image" but rendered as
 * text inputs holding baked /images/… paths (the plan's old decorative/content
 * split). Editors get a proper file picker; bytes live in R2 like all other
 * media. Companion to setup-flatten-json.mjs (same lifecycle).
 *
 *   pages_translations  hero_image (string path)        -> hero_image_file (uuid -> directus_files)
 *                       about_hero_photo (string path)  -> about_hero_photo_file
 *                       about_ceo_portrait (string path)-> about_ceo_portrait_file
 *                       about_board_members[].photo     -> IN-PLACE: path replaced by file uuid,
 *                                                          repeater subfield switched to a file picker
 *
 * Migration uploads the referenced public/ assets (sha256 dedupe via the file
 * `description` tag — same convention as scripts/directus-seed.mjs) so the
 * site keeps rendering the exact same images. Must run from the repo root
 * (reads ./public). value_props_items[].icon is left alone — unused in data.
 *
 * The normalizer resolves uuid -> media URL with a path-string fallback
 * (server/utils/cms-normalizers.ts fileUrlResolver) — keep in sync.
 *
 * Usage:  DIRECTUS_URL=... DIRECTUS_TOKEN=... node directus/setup-image-fields.mjs [--force] [--drop-legacy]
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createHash } from 'node:crypto'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const FORCE = process.argv.includes('--force')
const DROP = process.argv.includes('--drop-legacy')
const ROOT = process.cwd()

async function api(method, path, body, isForm = false) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// path field -> { file field, form group, sort }
const FIELDS = [
  { legacy: 'hero_image', field: 'hero_image_file', group: 'hero_group', sort: 5, note: 'Hero image.' },
  { legacy: 'about_hero_photo', field: 'about_hero_photo_file', group: 'about_hero_group', sort: 3, note: 'Hero photo.' },
  { legacy: 'about_ceo_portrait', field: 'about_ceo_portrait_file', group: 'about_ceo_group', sort: 9, note: 'CEO portrait.' },
]

// sha256-deduped upload of a public/ asset (seed convention: tag in description)
const fileCache = new Map()
async function uploadImage(publicPath) {
  if (!publicPath || UUID_RE.test(publicPath)) return null
  if (fileCache.has(publicPath)) return fileCache.get(publicPath)
  const diskPath = join(ROOT, 'public', publicPath.replace(/^\//, ''))
  if (!existsSync(diskPath)) {
    console.error(`  ! image not found on disk: ${publicPath} (run from the repo root)`)
    fileCache.set(publicPath, null)
    return null
  }
  const buf = readFileSync(diskPath)
  const tag = `sha256:${createHash('sha256').update(buf).digest('hex')}`
  const existing = await api('GET', `/files?filter[description][_eq]=${encodeURIComponent(tag)}&limit=1&fields=id`)
  let id
  if (existing?.length) {
    id = existing[0].id
    log('skip', `reusing uploaded ${publicPath}`)
  } else {
    const form = new FormData()
    form.append('title', basename(publicPath))
    form.append('description', tag)
    form.append('file', new Blob([buf]), basename(publicPath))
    id = (await api('POST', '/files', form, true)).id
    log('add', `uploaded ${publicPath}`)
  }
  fileCache.set(publicPath, id)
  return id
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
if (!token) {
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set DIRECTUS_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.')
    process.exit(1)
  }
  token = (await api('POST', '/auth/login', { email, password })).access_token
}
console.log(`\nImage-upload fields on ${BASE}\n`)

// 1. relational file fields + repeater file picker -----------------------------
console.log('[fields]')
for (const { field, group, sort, note } of FIELDS) {
  if (await exists(`/fields/${T}/${field}`)) log('skip', `${field} exists`)
  else {
    await api('POST', `/fields/${T}`, {
      field,
      type: 'uuid',
      meta: { interface: 'file-image', special: ['file'], width: 'full', group, sort, note: `${note} Stored in R2.` },
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
}

// board repeater: photo subfield becomes a file picker (stores the uuid in JSON)
{
  const f = await api('GET', `/fields/${T}/about_board_members`)
  const fields = f.meta?.options?.fields ?? []
  const photo = fields.find((x) => x.field === 'photo')
  if (photo?.meta?.interface === 'file') log('skip', 'about_board_members.photo already a file picker')
  else if (photo) {
    photo.meta = { ...photo.meta, interface: 'file', note: 'Member photo. Stored in R2.' }
    photo.type = 'uuid'
    await api('PATCH', `/fields/${T}/about_board_members`, { meta: { options: { ...f.meta.options, fields } } })
    log('add', 'about_board_members.photo -> file picker')
  }
}

// 2. migrate ------------------------------------------------------------------
console.log('[migrate]')
const legacyNames = FIELDS.map((x) => x.legacy)
const fileNames = FIELDS.map((x) => x.field)
const rows = await api(
  'GET',
  `/items/${T}?limit=-1&fields=id,languages_code,about_board_members,${[...legacyNames, ...fileNames].join(',')}`,
)
let failures = 0
for (const row of rows) {
  const label = `${T}#${row.id} (${row.languages_code})`
  const patch = {}

  for (const { legacy, field } of FIELDS) {
    if (!row[legacy]) continue
    if (row[field] && !FORCE) continue
    const id = await uploadImage(row[legacy])
    if (id) patch[field] = id
    else if (row[legacy]) failures++
  }

  const members = row.about_board_members
  if (Array.isArray(members) && members.some((m) => m?.photo && !UUID_RE.test(m.photo))) {
    const migrated = []
    for (const m of members) {
      if (m?.photo && !UUID_RE.test(m.photo)) {
        const id = await uploadImage(m.photo)
        if (!id) failures++
        migrated.push(id ? { ...m, photo: id } : m)
      } else migrated.push(m)
    }
    patch.about_board_members = migrated
  }

  if (Object.keys(patch).length) {
    await api('PATCH', `/items/${T}/${row.id}`, patch)
    log('add', `${label}: linked ${Object.keys(patch).join(', ')}`)
  } else {
    log('skip', `${label}: nothing to migrate`)
  }
}

// 3. hide legacy path fields --------------------------------------------------
for (const legacy of legacyNames) {
  if (!(await exists(`/fields/${T}/${legacy}`))) continue
  await api('PATCH', `/fields/${T}/${legacy}`, {
    meta: { readonly: true, hidden: true, note: 'DEPRECATED — replaced by the upload field. Removed after deploy verification.' },
  })
}
log('add', `legacy path fields hidden: ${legacyNames.join(', ')}`)

if (failures) {
  console.error(`\n${failures} image(s) could not be migrated — fix and re-run before --drop-legacy.`)
  process.exit(1)
}

if (DROP) {
  console.log('[drop-legacy]')
  for (const legacy of legacyNames) {
    if (await exists(`/fields/${T}/${legacy}`)) {
      await api('DELETE', `/fields/${T}/${legacy}`)
      log('add', `deleted ${T}.${legacy}`)
    } else log('skip', `${T}.${legacy} already gone`)
  }
}

console.log(`
Done. Next:
  1. Studio: pages -> home/about — hero image + About photos should be file pickers
     with thumbnails; board members open with a photo picker per row.
  2. Deploy the app (normalizer resolves file uuids, falls back to path strings).
  3. Verify prod, then re-run with --drop-legacy.
  4. make snapshot-directus  -> commit directus/schema.yaml
`)
