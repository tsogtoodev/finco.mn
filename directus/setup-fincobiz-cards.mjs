#!/usr/bin/env node
/**
 * FincoBiz card deck: per-card heading + body.
 *
 * Before this, `pages_translations.fincobiz_card_<id>` was a lone string — the
 * card's tab label — so of the deck's nine copy fields only three reached the
 * CMS. The headings and bodies came from i18n and were not editable, except on
 * the `request` card, which borrowed the section-level
 * fincobiz_callout_heading / fincobiz_callout_subtext.
 *
 * This adds `fincobiz_card_<id>_heading` and `fincobiz_card_<id>_body` for all
 * three cards, alongside the existing tab field and in the same
 * `home_fincobiz_group`, then seeds them from the values those cards render
 * today so publishing does not blank the section.
 *
 * Idempotent — safe to re-run. Existing fields are skipped, and seeding only
 * fills a field that is empty (pass --force to overwrite).
 *
 * The shape is mirrored by assembleFincobizCards() in
 * server/utils/cms-normalizers.ts and by the `fincobiz.cards` schema in
 * content.config.ts — keep the three in sync.
 *
 * Usage:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node directus/setup-fincobiz-cards.mjs [--force]
 *   (or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD instead of a token)
 *
 * NOTE: needs an ADMIN token. NUXT_CMS_TOKEN is the published-only api-reader
 * and cannot create fields.
 */

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const FORCE = process.argv.includes('--force')

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
const GROUP = 'home_fincobiz_group'
const CARDS = ['request', 'receivables', 'eligibility']

// Sorts continue after the three existing tab fields (4, 5, 6).
let sort = 7
const input = (field, note) => ({
  field,
  type: 'string',
  meta: { interface: 'input', width: 'half', group: GROUP, note, sort: sort++ },
  schema: {},
})
const text = (field, note) => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full', group: GROUP, note, sort: sort++ },
  schema: {},
})

const FIELDS = CARDS.flatMap((id) => [
  input(`fincobiz_card_${id}_heading`, `Card-deck heading — "${id}" card.`),
  text(`fincobiz_card_${id}_body`, `Card-deck body copy — "${id}" card.`),
])

// Seed values: exactly what each card renders today, so the first publish after
// this migration is a no-op visually. mn/en keyed by languages_code.
// Source of truth is i18n/locales/*.json → home.fincobiz.cards.<id>.
const SEED = {
  mn: {
    request: {
      heading: 'Таны бодсоноос ч хурдан',
      body: 'Санхүүгийн орчин үеийн үйлчилгээг хүргэх дижитал шийдэл.',
    },
    receivables: {
      heading: 'Авлагын мэдээлэл хянах',
      body: 'Төлбөрөө хүлээлгүйгээр урьдчилсан санхүүжилт авах боломжтой.',
    },
    eligibility: {
      heading: 'Зээлийн эрх шалгах',
      body: 'Бизнесийн зээл болон уян хатан санхүүжилтийг хамгийн хурдан, хялбар, амархан шийдэх боломж.',
    },
  },
  en: {
    request: {
      heading: 'Faster than you think',
      body: 'A digital solution delivering modern financial services.',
    },
    receivables: {
      heading: 'Receivables-backed loan',
      body: 'Get advance financing without waiting to be paid.',
    },
    eligibility: {
      heading: 'Check your loan eligibility with ease',
      body: 'A digital platform that handles business loans and flexible financing for companies in the fastest, simplest and easiest way.',
    },
  },
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
console.log(`\nFincoBiz card fields on ${BASE}\n`)

// 1. fields ------------------------------------------------------------------
console.log('[fields]')
if (!(await exists(`/fields/${T}/${GROUP}`))) {
  console.error(`  ! ${T}.${GROUP} is missing — run setup-flatten-json.mjs first.`)
  process.exit(1)
}
for (const fld of FIELDS) {
  if (await exists(`/fields/${T}/${fld.field}`)) log('skip', `${T}.${fld.field} exists`)
  else {
    await api('POST', `/fields/${T}`, fld)
    log('add', `${T}.${fld.field}`)
  }
}

// 2. seed --------------------------------------------------------------------
// Only the `home` page record has these fields; the other five page records
// leave them null and are untouched.
console.log('\n[seed]')
const rows = await api(
  'GET',
  `/items/pages?filter[key][_eq]=home&fields=id,translations.id,translations.languages_code,${CARDS.flatMap((id) => [
    `translations.fincobiz_card_${id}_heading`,
    `translations.fincobiz_card_${id}_body`,
  ]).join(',')}&limit=1`,
)
const home = rows?.[0]
if (!home) {
  console.error('  ! no `home` page record found — nothing to seed.')
  process.exit(1)
}

for (const tr of home.translations ?? []) {
  const seed = SEED[tr.languages_code]
  if (!seed) {
    log('skip', `${tr.languages_code}: no seed values`)
    continue
  }
  const patch = {}
  for (const id of CARDS) {
    for (const key of ['heading', 'body']) {
      const field = `fincobiz_card_${id}_${key}`
      const current = tr[field]
      if (FORCE || current === null || current === undefined || current === '') {
        patch[field] = seed[id][key]
      }
    }
  }
  if (!Object.keys(patch).length) {
    log('skip', `${tr.languages_code}: already populated`)
    continue
  }
  await api('PATCH', `/items/pages_translations/${tr.id}`, patch)
  log('add', `${tr.languages_code}: ${Object.keys(patch).length} field(s)`)
}

console.log(`
Done. Next:
  • the app reads these through the pages \`translations.*\` wildcard, so no
    field-list change is needed in server/utils/cms-normalizers.ts
  • publishing the home record purges the CMS + page caches via the revalidate
    webhook; otherwise the 60s TTL applies
`)
