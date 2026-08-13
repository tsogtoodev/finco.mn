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

const KEY_ART = {
  fincoBiz: '/images/products/hero-business.jpg',
  beepWallet: '/images/home/hero-beep-bg.jpg',
  loans: '/images/products/hero-individual.jpg',
  trust: '/images/services/itgeltsel-hero.jpg',
}

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
console.log(`\nHero-slide background images on ${BASE}\n`)

console.log('[field]')
{
  const f = await api('GET', `/fields/${T}/hero_slides`)
  const options = f.meta?.options ?? {}
  const fields = [...(options.fields ?? [])]
  const image = fields.find((x) => x.field === 'image')
  if (image?.meta?.interface === 'file') {
    log('skip', 'hero_slides.image already a file picker')
  } else {
    const entry = {
      field: 'image',
      name: 'image',
      type: 'uuid',
      meta: {
        field: 'image',
        interface: 'file',
        width: 'full',
        note: 'Slide background photo (1440x737). Stored in R2. Leave empty to use the built-in art.',
      },
    }
    if (image) Object.assign(image, entry)
    else fields.push(entry)
    await api('PATCH', `/fields/${T}/hero_slides`, { meta: { options: { ...options, fields } } })
    log('add', `hero_slides.image -> file picker`)
  }
}

console.log('[migrate]')
const rows = await api('GET', `/items/${T}?limit=-1&fields=id,languages_code,hero_slides`)
let failures = 0
let touched = 0
for (const row of rows) {
  const slides = row.hero_slides
  if (!Array.isArray(slides) || !slides.length) continue
  const label = `${T}#${row.id} (${row.languages_code})`

  let changed = false
  const migrated = []
  for (const s of slides) {
    if (s?.image && !FORCE) {
      migrated.push(s)
      continue
    }
    const art = KEY_ART[s?.key]
    if (!art) {
      if (s?.key) console.error(`  ! ${label}: unknown slide key "${s.key}" — no baked art to back-fill`)
      migrated.push(s)
      continue
    }
    const id = await uploadImage(art)
    if (!id) {
      failures++
      migrated.push(s)
      continue
    }
    migrated.push({ ...s, image: id })
    changed = true
  }

  if (changed) {
    await api('PATCH', `/items/${T}/${row.id}`, { hero_slides: migrated })
    log('add', `${label}: linked ${migrated.filter((s) => s.image).length}/${migrated.length} slide images`)
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
  1. Studio: pages -> home -> Hero slides — each row has an Image picker with a thumbnail.
  2. Deploy the app (normalizer resolves the uuid; empty falls back to the baked art).
  3. make snapshot-directus  -> commit directus/schema.yaml
`)
