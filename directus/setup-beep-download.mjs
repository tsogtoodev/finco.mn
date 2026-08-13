#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createHash } from 'node:crypto'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const FORCE = process.argv.includes('--force')
const ROOT = process.cwd()

const T = 'pages_translations'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const QR_ART = '/images/home/beep-qr-v2.png'
const LABELS = { mn: 'Апп татах:', en: 'Download the app:' }

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

if (!token) {
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set DIRECTUS_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.')
    process.exit(1)
  }
  token = (await api('POST', '/auth/login', { email, password })).access_token
}
console.log(`\nBeep download block (label + QR) on ${BASE}\n`)

console.log('[fields]')
if (await exists(`/fields/${T}/beep_download_label`)) log('skip', 'beep_download_label exists')
else {
  await api('POST', `/fields/${T}`, {
    field: 'beep_download_label',
    type: 'string',
    meta: {
      interface: 'input',
      width: 'full',
      group: 'home_beep_group',
      sort: 6,
      note: 'Label above the App Store / Google Play badges, e.g. "Апп татах:".',
    },
    schema: {},
  })
  log('add', 'beep_download_label')
}

if (await exists(`/fields/${T}/beep_qr_file`)) log('skip', 'beep_qr_file exists')
else {
  await api('POST', `/fields/${T}`, {
    field: 'beep_qr_file',
    type: 'uuid',
    meta: {
      interface: 'file-image',
      special: ['file'],
      width: 'full',
      group: 'home_beep_group',
      sort: 7,
      note: 'Download QR shown beside the store badges (177x186). Stored in R2.',
    },
    schema: {},
  })
  await api('POST', '/relations', {
    collection: T,
    field: 'beep_qr_file',
    related_collection: 'directus_files',
    schema: { on_delete: 'SET NULL' },
  })
  log('add', 'beep_qr_file (+ relation to directus_files)')
}

console.log('[migrate]')
const rows = await api(
  'GET',
  `/items/${T}?limit=-1&fields=id,languages_code,beep_expand_lead,beep_download_label,beep_qr_file`,
)
let failures = 0
let touched = 0
for (const row of rows) {
  const lang = String(row.languages_code ?? '').slice(0, 2).toLowerCase()
  const label = `${T}#${row.id} (${row.languages_code})`
  if (!row.beep_expand_lead) {
    log('skip', `${label}: no Beep block`)
    continue
  }

  const patch = {}
  if (!row.beep_download_label || FORCE) {
    const value = LABELS[lang]
    if (value) patch.beep_download_label = value
    else console.error(`  ! ${label}: no label for language "${row.languages_code}" — fill it in Studio`)
  }
  if (!row.beep_qr_file || FORCE) {
    const id = await uploadImage(QR_ART)
    if (id) patch.beep_qr_file = id
    else failures++
  }

  if (Object.keys(patch).length) {
    await api('PATCH', `/items/${T}/${row.id}`, patch)
    log('add', `${label}: set ${Object.keys(patch).join(', ')}`)
    touched++
  } else {
    log('skip', `${label}: nothing to migrate`)
  }
}

if (failures) {
  console.error(`\n${failures} image(s) could not be migrated — fix and re-run.`)
  process.exit(1)
}

console.log(`
Done (${touched} row(s) updated). Next:
  1. Studio: pages -> home -> Beep showcase — "beep_download_label" holds the badge
     label and "beep_qr_file" shows the QR with a thumbnail, per language.
  2. Deploy the app (the normalizer reads both; empty falls back to i18n + the baked QR).
  3. make snapshot-directus  -> commit directus/schema.yaml
`)
