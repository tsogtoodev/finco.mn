#!/usr/bin/env node
/**
 * About-blob restructure: replaces the single raw-JSON `pages_translations.about`
 * field (the whole About page in one code editor) with structured per-section
 * fields, grouped under one collapsed "About page" group so the other five
 * page records aren't cluttered.
 *
 * Idempotent — safe to re-run. Three stages per run:
 *   1. ensure the group aliases + about_* fields exist
 *   2. migrate: explode the `about` JSON of each translation row into the new
 *      fields (skips rows already migrated unless --force), then verify the
 *      new fields reassemble to the original blob (align is intentionally
 *      dropped — dead since the AboutValues redesign; greetingBody round-trips
 *      through a blank-line-separated textarea)
 *   3. only with --drop-blob (after the app deploy is verified): delete the
 *      `about` field. Until then the blob stays, marked readonly + deprecated.
 *
 * Shape mapping (blob path -> field) is mirrored by assembleAbout() in
 * server/utils/cms-normalizers.ts and the pages mapper in
 * scripts/directus-seed.mjs — keep the three in sync.
 *
 * Usage:  DIRECTUS_URL=... DIRECTUS_TOKEN=... node directus/setup-about-restructure.mjs [--force] [--drop-blob]
 */

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const FORCE = process.argv.includes('--force')
const DROP_BLOB = process.argv.includes('--drop-blob')

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

// ---------------------------------------------------------------------------
// Field definitions
// ---------------------------------------------------------------------------
const T = 'pages_translations'

const group = (field, groupParent, note, opts = {}) => ({
  field,
  type: 'alias',
  meta: {
    interface: 'group-detail',
    special: ['alias', 'no-data', 'group'],
    options: { start: opts.start ?? 'closed', headerIcon: opts.icon },
    width: 'full',
    note,
    ...(groupParent ? { group: groupParent } : {}),
  },
})
const input = (field, g, opts = {}) => ({
  field,
  type: 'string',
  meta: { interface: 'input', width: opts.width ?? 'half', group: g, note: opts.note },
  schema: {},
})
const text = (field, g, opts = {}) => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full', group: g, note: opts.note },
  schema: {},
})
const repeater = (field, g, subfields, opts = {}) => ({
  field,
  type: 'json',
  meta: {
    interface: 'list',
    special: ['cast-json'],
    width: 'full',
    group: g,
    options: {
      template: opts.template,
      fields: subfields.map(([name, iface, type]) => ({
        field: name,
        name,
        type: type ?? 'string',
        meta: { field: name, interface: iface ?? 'input', width: 'full' },
      })),
    },
    note: opts.note,
  },
  schema: {},
})
const tags = (field, g, opts = {}) => ({
  field,
  type: 'json',
  meta: { interface: 'tags', special: ['cast-json'], width: 'full', group: g, note: opts.note },
  schema: {},
})

const GROUPS = [
  group('about_group', null, 'Structured content for the ABOUT page record only — ignore on other pages.', { icon: 'info' }),
  group('about_hero_group', 'about_group', 'Dark hero at the top.'),
  group('about_mission_group', 'about_group', 'Mission blocks (badge + heading + body).'),
  group('about_values_group', 'about_group', 'Values section — heading + the five click-to-activate cards.'),
  group('about_history_group', 'about_group', 'History timeline.'),
  group('about_ceo_group', 'about_group', 'CEO message.'),
  group('about_board_group', 'about_group', 'Board of directors.'),
  group('about_org_group', 'about_group', 'Organization chart.'),
]

const FIELDS = [
  input('about_hero_headline', 'about_hero_group', { width: 'full' }),
  text('about_hero_intro', 'about_hero_group'),
  input('about_hero_photo', 'about_hero_group', { note: 'Site asset path, e.g. /images/about/hero.png.' }),

  repeater('about_mission_blocks', 'about_mission_group',
    [['badge'], ['heading'], ['body', 'input-multiline', 'text']],
    { template: '{{badge}} — {{heading}}' }),

  input('about_values_heading_lead', 'about_values_group'),
  input('about_values_heading_accent', 'about_values_group', { note: 'Rendered in the accent color, directly after the lead.' }),
  text('about_values_subheading', 'about_values_group'),
  repeater('about_values_items', 'about_values_group',
    [['title'], ['body', 'input-multiline', 'text']],
    { template: '{{title}}' }),

  input('about_history_heading_lead', 'about_history_group'),
  input('about_history_heading_accent', 'about_history_group', { note: 'Rendered in the accent color, directly after the lead.' }),
  text('about_history_subheading', 'about_history_group'),
  repeater('about_history_milestones', 'about_history_group',
    [['year'], ['body', 'input-multiline', 'text']],
    { template: '{{year}}' }),

  input('about_ceo_heading_lead', 'about_ceo_group'),
  input('about_ceo_heading_accent', 'about_ceo_group', { note: 'Rendered in the accent color, directly after the lead.' }),
  text('about_ceo_subheading', 'about_ceo_group'),
  input('about_ceo_greeting_title', 'about_ceo_group', { width: 'full' }),
  text('about_ceo_greeting_body', 'about_ceo_group', { note: 'Separate paragraphs with a blank line.' }),
  input('about_ceo_tagline', 'about_ceo_group', { width: 'full' }),
  input('about_ceo_signature_label', 'about_ceo_group'),
  input('about_ceo_signature_name', 'about_ceo_group'),
  input('about_ceo_portrait', 'about_ceo_group', { note: 'Site asset path.' }),

  input('about_board_heading_lead', 'about_board_group'),
  input('about_board_heading_accent', 'about_board_group', { note: 'Rendered in the accent color, directly after the lead.' }),
  repeater('about_board_members', 'about_board_group',
    [['name'], ['role'], ['bio', 'input-multiline', 'text'], ['bioHover', 'input-multiline', 'text'], ['photo']],
    { template: '{{name}}', note: 'bioHover (optional) is the career timeline shown on hover; newlines are preserved. photo is a site asset path.' }),

  input('about_org_heading_lead', 'about_org_group'),
  input('about_org_heading_accent', 'about_org_group', { note: 'Rendered in the accent color, directly after the lead.' }),
  text('about_org_subheading', 'about_org_group'),
  input('about_org_root', 'about_org_group', { note: 'Top node label (e.g. shareholders meeting).' }),
  input('about_org_ceo', 'about_org_group', { note: 'CEO node label.' }),
  tags('about_org_departments', 'about_org_group', { note: 'One tag per department pill, in display order.' }),
]

// blob -> flat row (align intentionally dropped; greetingBody joined)
function explode(about) {
  const a = about ?? {}
  return {
    about_hero_headline: a.hero?.headline ?? null,
    about_hero_intro: a.hero?.intro ?? null,
    about_hero_photo: a.hero?.photo ?? null,
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
    about_ceo_portrait: a.ceo?.portrait ?? null,
    about_board_heading_lead: a.board?.headingLead ?? null,
    about_board_heading_accent: a.board?.headingAccent ?? null,
    about_board_members: a.board?.members ?? null,
    about_org_heading_lead: a.org?.headingLead ?? null,
    about_org_heading_accent: a.org?.headingAccent ?? null,
    about_org_subheading: a.org?.subheading ?? null,
    about_org_root: a.org?.root ?? null,
    about_org_ceo: a.org?.ceo ?? null,
    about_org_departments: a.org?.departments ?? null,
  }
}

// flat row -> blob (must mirror assembleAbout in cms-normalizers.ts)
function assemble(r) {
  if (!r.about_hero_headline) return null
  return {
    hero: { headline: r.about_hero_headline, intro: r.about_hero_intro, photo: r.about_hero_photo },
    mission: { blocks: r.about_mission_blocks ?? [] },
    values: {
      headingLead: r.about_values_heading_lead,
      headingAccent: r.about_values_heading_accent,
      subheading: r.about_values_subheading,
      items: r.about_values_items ?? [],
    },
    history: {
      headingLead: r.about_history_heading_lead,
      headingAccent: r.about_history_heading_accent,
      subheading: r.about_history_subheading,
      milestones: r.about_history_milestones ?? [],
    },
    ceo: {
      headingLead: r.about_ceo_heading_lead,
      headingAccent: r.about_ceo_heading_accent,
      subheading: r.about_ceo_subheading,
      greetingTitle: r.about_ceo_greeting_title,
      greetingBody: (r.about_ceo_greeting_body ?? '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
      tagline: r.about_ceo_tagline,
      signatureLabel: r.about_ceo_signature_label,
      signatureName: r.about_ceo_signature_name,
      portrait: r.about_ceo_portrait,
    },
    board: {
      headingLead: r.about_board_heading_lead,
      headingAccent: r.about_board_heading_accent,
      members: r.about_board_members ?? [],
    },
    org: {
      headingLead: r.about_org_heading_lead,
      headingAccent: r.about_org_heading_accent,
      subheading: r.about_org_subheading,
      root: r.about_org_root,
      ceo: r.about_org_ceo,
      departments: r.about_org_departments ?? [],
    },
  }
}

// deep-compare ignoring dropped `align` keys and greetingBody whitespace round-trip
function normalizeForDiff(about) {
  if (!about) return about
  const clone = JSON.parse(JSON.stringify(about))
  clone.values.items = clone.values.items?.map(({ title, body }) => ({ title, body }))
  clone.ceo.greetingBody = clone.ceo.greetingBody?.map((s) => s.trim()).filter(Boolean)
  return clone
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
console.log(`\nAbout-blob restructure on ${BASE}\n`)

// 1. fields ------------------------------------------------------------------
console.log('[fields]')
for (const fld of [...GROUPS, ...FIELDS]) {
  if (await exists(`/fields/${T}/${fld.field}`)) log('skip', `${T}.${fld.field} exists`)
  else {
    await api('POST', `/fields/${T}`, fld)
    log('add', `${T}.${fld.field}`)
  }
}

// 2. migrate -----------------------------------------------------------------
console.log('[migrate]')
const blobExists = await exists(`/fields/${T}/about`)
if (!blobExists) {
  log('skip', 'about blob already dropped — nothing to migrate')
} else {
  const aboutPage = (await api('GET', `/items/pages?filter[key][_eq]=about&fields=id&limit=1`))?.[0]
  if (!aboutPage) throw new Error('pages record with key=about not found')
  const rows = await api(
    'GET',
    `/items/${T}?filter[pages_id][_eq]=${aboutPage.id}&limit=-1&fields=id,languages_code,about,${FIELDS.map((x) => x.field).join(',')}`,
  )
  let failures = 0
  for (const row of rows) {
    const label = `${T}#${row.id} (${row.languages_code})`
    if (!row.about) {
      log('skip', `${label}: no about blob`)
      continue
    }
    const migrated = FIELDS.some((x) => row[x.field] != null)
    if (migrated && !FORCE) {
      log('skip', `${label}: already migrated (--force to overwrite from blob)`)
    } else {
      await api('PATCH', `/items/${T}/${row.id}`, explode(row.about))
      log('add', `${label}: exploded about blob into ${FIELDS.length} fields`)
    }
    // verify round-trip against the blob regardless of who wrote the fields
    const fresh = await api('GET', `/items/${T}/${row.id}?fields=about,${FIELDS.map((x) => x.field).join(',')}`)
    const want = JSON.stringify(normalizeForDiff(fresh.about))
    const got = JSON.stringify(normalizeForDiff(assemble(fresh)))
    if (want === got) log('add', `${label}: verified — fields reassemble to the original blob`)
    else {
      failures++
      console.error(`  ! ${label}: MISMATCH between reassembled fields and blob — inspect before dropping`)
    }
  }
  if (failures) process.exit(1)

  // hide + readonly the blob so editors can't keep two sources alive
  await api('PATCH', `/fields/${T}/about`, {
    meta: { readonly: true, hidden: true, note: 'DEPRECATED — replaced by the "About page" group. Removed once the site deploy is verified.' },
  })
  log('add', 'about blob marked hidden + readonly + deprecated')
}

// 3. drop --------------------------------------------------------------------
if (DROP_BLOB) {
  console.log('[drop-blob]')
  if (!blobExists) log('skip', 'about blob already gone')
  else {
    await api('DELETE', `/fields/${T}/about`)
    log('add', `deleted ${T}.about`)
  }
}

console.log(`
Done. Next:
  1. Open Content → Pages → about in the admin: check the "About page" group renders
     each section as inputs/repeaters, both locales.
  2. Deploy the app (normalizer now reads the about_* fields).
  3. Verify /about + /en/about in production, then re-run with --drop-blob.
  4. make snapshot-directus  -> commit directus/schema.yaml
`)
