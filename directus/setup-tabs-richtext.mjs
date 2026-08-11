#!/usr/bin/env node
/**
 * Product detail tabs -> rich text.
 *
 * Only the first tab ("Үйлчилгээний нөхцөл") had an editor: it is the `body`
 * markdown field. The other two were plain controls —
 *
 *   tabs_requirements  json repeater of { text }   (interface: list)
 *   tabs_other         plain textarea              (interface: input-multiline)
 *
 * — so editors could not bold a word, add a link, or build a table there. Both
 * become markdown fields on the same `input-rich-text-md` editor `body` uses.
 * The repeater rows fold into an ordered list, which is exactly what the site
 * rendered before (numbered rows with hairline dividers — DetailTabs styles
 * `ol` to keep that look), so nothing changes visually.
 *
 * Mirrored by scripts/directus-seed.mjs and server/utils/cms-normalizers.ts,
 * and supersedes the tabs_* part of setup-flatten-json.mjs — keep them in sync.
 *
 * Order matters: the field type is altered BEFORE any row is written, so a
 * failed ALTER leaves the data untouched. Every pre-migration value is dumped
 * to directus/backups/ first regardless.
 *
 * Usage:  DIRECTUS_URL=... DIRECTUS_TOKEN=<admin> node directus/setup-tabs-richtext.mjs [--dry-run]
 */

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

/**
 * Repeater rows -> markdown. Accepts what the column can actually hold at this
 * point in the migration: real arrays, the JSON string a text column returns
 * once the type has already been altered, and markdown that is already done.
 */
function toMarkdown(value) {
  if (value == null || value === '') return null
  let rows = value
  if (typeof rows === 'string') {
    const s = rows.trim()
    if (!s.startsWith('[')) return rows // already markdown
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
  // Ordered list: `1.` on every row is valid markdown and renumbers itself, but
  // real numbers keep the CMS editor's source readable.
  return items.map((s, i) => `${i + 1}. ${s.replace(/\n+/g, ' ')}`).join('\n')
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
console.log(`\nProduct tabs -> rich text on ${BASE}${DRY ? '  (dry run)' : ''}\n`)

const rows = await api(`GET`, `/items/${COLLECTION}?limit=-1&fields=id,tabs_requirements,tabs_other`)
const backup = join(HERE, 'backups', 'tabs-before-richtext.json')
mkdirSync(dirname(backup), { recursive: true })
writeFileSync(backup, JSON.stringify(rows, null, 2))
log('add', `backed up ${rows.length} rows -> ${backup}`)

const planned = rows
  .map((r) => ({ id: r.id, from: r.tabs_requirements, to: toMarkdown(r.tabs_requirements) }))
  .filter((p) => p.to !== null && JSON.stringify(p.from) !== JSON.stringify(p.to))

// ── fields ──────────────────────────────────────────────────────────────────
const fields = Object.fromEntries(
  (await api('GET', `/fields/${COLLECTION}`)).map((f) => [f.field, f]),
)

const FIELD_PATCHES = [
  {
    field: 'tabs_requirements',
    // json repeater -> text. `special` must be cleared too: cast-json would keep
    // parsing the column, and the markdown string is not JSON.
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

// ── data ────────────────────────────────────────────────────────────────────
if (!planned.length) log('skip', 'no repeater rows left to fold into markdown')
for (const p of planned) {
  if (DRY) {
    log('add', `would rewrite #${p.id}:\n${p.to.replace(/^/gm, '      ')}`)
    continue
  }
  await api('PATCH', `/items/${COLLECTION}/${p.id}`, { tabs_requirements: p.to })
  log('add', `#${p.id}: ${Array.isArray(p.from) ? p.from.length : '?'} rows -> markdown`)
}

// ── verify ──────────────────────────────────────────────────────────────────
if (!DRY) {
  const after = await api('GET', `/items/${COLLECTION}?limit=-1&fields=id,tabs_requirements`)
  const bad = after.filter((r) => r.tabs_requirements != null && typeof r.tabs_requirements !== 'string')
  if (bad.length) {
    console.error(`\n✗ ${bad.length} rows still hold non-string values: ${bad.map((r) => r.id).join(', ')}`)
    process.exit(1)
  }
}

console.log(`\n✓ done — both tabs now use the ${RICH_TEXT} editor\n`)
