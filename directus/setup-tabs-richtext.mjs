#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const DRY = process.argv.includes('--dry-run')
const HERE = dirname(fileURLToPath(import.meta.url))

const COLLECTION = 'products_translations'
const RICH_TEXT = 'input-rich-text-md'

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

function toMarkdown(value) {
  if (value == null || value === '') return null
  let rows = value
  if (typeof rows === 'string') {
    const s = rows.trim()
    if (!s.startsWith('[')) return rows
    try {
      rows = JSON.parse(s)
    } catch {
      return rows
    }
  }
  if (!Array.isArray(rows)) return String(rows)
  const items = rows
    .map((r) => (typeof r === 'string' ? r : r?.text))
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim())
  if (!items.length) return null
  return items.map((s, i) => `${i + 1}. ${s.replace(/\n+/g, ' ')}`).join('\n')
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
console.log(`\nProduct tabs -> rich text on ${BASE}${DRY ? '  (dry run)' : ''}\n`)

const rows = await api(`GET`, `/items/${COLLECTION}?limit=-1&fields=id,tabs_requirements,tabs_other`)
const backup = join(HERE, 'backups', 'tabs-before-richtext.json')
mkdirSync(dirname(backup), { recursive: true })
writeFileSync(backup, JSON.stringify(rows, null, 2))
log('add', `backed up ${rows.length} rows -> ${backup}`)

const planned = rows
  .map((r) => ({ id: r.id, from: r.tabs_requirements, to: toMarkdown(r.tabs_requirements) }))
  .filter((p) => p.to !== null && JSON.stringify(p.from) !== JSON.stringify(p.to))

const fields = Object.fromEntries(
  (await api('GET', `/fields/${COLLECTION}`)).map((f) => [f.field, f]),
)

const FIELD_PATCHES = [
  {
    field: 'tabs_requirements',
    body: {
      type: 'text',
      schema: { data_type: 'text' },
      meta: {
        interface: RICH_TEXT,
        special: null,
        options: null,
        display: null,
        display_options: null,
        width: 'full',
        note: 'Markdown. The "Requirements" tab — a numbered list renders as the design\'s numbered rows.',
      },
    },
  },
  {
    field: 'tabs_other',
    body: {
      meta: {
        interface: RICH_TEXT,
        note: 'Markdown. The "Other documents" tab.',
      },
    },
  },
]

for (const { field, body } of FIELD_PATCHES) {
  const current = fields[field]
  if (!current) {
    console.error(`  ! ${field} does not exist on ${COLLECTION} — run setup-flatten-json.mjs first`)
    process.exit(1)
  }
  if (current.meta?.interface === RICH_TEXT) {
    log('skip', `${field} already ${RICH_TEXT}`)
    continue
  }
  if (DRY) {
    log('add', `would patch ${field}: ${current.type}/${current.meta?.interface} -> text/${RICH_TEXT}`)
    continue
  }
  await api('PATCH', `/fields/${COLLECTION}/${field}`, body)
  log('add', `${field}: ${current.type}/${current.meta?.interface} -> text/${RICH_TEXT}`)
}

if (!planned.length) log('skip', 'no repeater rows left to fold into markdown')
for (const p of planned) {
  if (DRY) {
    log('add', `would rewrite #${p.id}:\n${p.to.replace(/^/gm, '      ')}`)
    continue
  }
  await api('PATCH', `/items/${COLLECTION}/${p.id}`, { tabs_requirements: p.to })
  log('add', `#${p.id}: ${Array.isArray(p.from) ? p.from.length : '?'} rows -> markdown`)
}

if (!DRY) {
  const after = await api('GET', `/items/${COLLECTION}?limit=-1&fields=id,tabs_requirements`)
  const bad = after.filter((r) => r.tabs_requirements != null && typeof r.tabs_requirements !== 'string')
  if (bad.length) {
    console.error(`\n✗ ${bad.length} rows still hold non-string values: ${bad.map((r) => r.id).join(', ')}`)
    process.exit(1)
  }
}

console.log(`\n✓ done — both tabs now use the ${RICH_TEXT} editor\n`)
