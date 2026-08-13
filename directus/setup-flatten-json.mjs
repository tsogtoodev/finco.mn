#!/usr/bin/env node

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null
const FORCE = process.argv.includes('--force')
const DROP = process.argv.includes('--drop-legacy')

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

const input = (field, opts = {}) => ({
  field,
  type: 'string',
  meta: { interface: 'input', width: opts.width ?? 'half', group: opts.group, sort: opts.sort, note: opts.note },
  schema: {},
})
const text = (field, opts = {}) => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full', group: opts.group, sort: opts.sort, note: opts.note },
  schema: {},
})
const float = (field, opts = {}) => ({
  field,
  type: 'float',
  meta: { interface: 'input', width: 'half', group: opts.group, sort: opts.sort, note: opts.note },
  schema: {},
})
const repeater = (field, subfields, opts = {}) => ({
  field,
  type: 'json',
  meta: {
    interface: 'list',
    special: ['cast-json'],
    width: 'full',
    group: opts.group,
    sort: opts.sort,
    options: {
      template: opts.template,
      fields: subfields.map(([name, iface, type, fopts]) => ({
        field: name,
        name,
        type: type ?? 'string',
        meta: { field: name, interface: iface ?? 'input', width: 'full', options: fopts },
      })),
    },
    note: opts.note,
  },
  schema: {},
})
const group = (field, note, opts = {}) => ({
  field,
  type: 'alias',
  meta: {
    interface: 'group-detail',
    special: ['alias', 'no-data', 'group'],
    options: { start: opts.start ?? 'open' },
    width: 'full',
    group: opts.group,
    sort: opts.sort,
    note,
  },
})

const strip = (o) => {
  const out = {}
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== '') out[k] = v
  return Object.keys(out).length ? out : undefined
}
const linkObj = (label, to) => strip({ label, to })
const wrapText = (arr) => arr?.map((s) => (typeof s === 'string' ? { text: s } : s)) ?? null
const unwrapText = (arr) => arr?.map((x) => (typeof x === 'string' ? x : x?.text)).filter(Boolean)
const stable = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x))

const SPECS = [
  {
    collection: 'pages_translations',
    parent: 'pages',
    groups: [
      group('hero_group', 'Page hero.', { sort: 10, start: 'open' }),
      group('home_valueprops_group', 'Value-prop bento block.', { group: 'home_group', sort: 34 }),
      group('home_beep_group', 'Beep showcase copy.', { group: 'home_group', sort: 35 }),
      group('home_fincobiz_group', 'FincoBiz showcase copy.', { group: 'home_group', sort: 36 }),
    ],
    fields: [
      input('hero_eyebrow', { group: 'hero_group', sort: 1 }),
      input('hero_headline', { group: 'hero_group', sort: 2, width: 'full' }),
      input('hero_accent', { group: 'hero_group', sort: 3, note: 'Substring of the headline rendered in the accent colour.' }),
      text('hero_subheadline', { group: 'hero_group', sort: 4 }),
      input('hero_cta_label', { group: 'hero_group', sort: 6, note: 'Primary button text.' }),
      input('hero_cta_to', { group: 'hero_group', sort: 7, note: 'Primary button route, e.g. /products.' }),
      input('hero_secondary_cta_label', { group: 'hero_group', sort: 8, note: 'Secondary button text.' }),
      input('hero_secondary_cta_to', { group: 'hero_group', sort: 9, note: 'Secondary button route.' }),

      input('value_props_heading', { group: 'home_valueprops_group', sort: 1, width: 'full' }),
      input('value_props_accent', { group: 'home_valueprops_group', sort: 2, note: 'Substring of the heading rendered in the accent colour.' }),
      text('value_props_subheading', { group: 'home_valueprops_group', sort: 3 }),
      repeater('value_props_items', [['title'], ['body', 'input-multiline', 'text'], ['icon']], { group: 'home_valueprops_group', sort: 4, template: '{{title}}' }),

      input('beep_heading', { group: 'home_beep_group', sort: 1, width: 'full' }),
      text('beep_subtext', { group: 'home_beep_group', sort: 2 }),
      input('beep_expand_lead', { group: 'home_beep_group', sort: 3, width: 'full', note: 'Lead of the expanding headline.' }),
      input('beep_expand_rest', { group: 'home_beep_group', sort: 4, width: 'full', note: 'Rest of the expanding headline.' }),
      input('beep_teaser', { group: 'home_beep_group', sort: 5, width: 'full', note: 'Loyalty teaser under the info bar (may start with an emoji).' }),
      input('beep_download_label', { group: 'home_beep_group', sort: 6, width: 'full', note: 'Label above the App Store / Google Play badges, e.g. "Апп татах:".' }),

      text('fincobiz_subtext', { group: 'home_fincobiz_group', sort: 1 }),
      input('fincobiz_callout_heading', { group: 'home_fincobiz_group', sort: 2, width: 'full' }),
      text('fincobiz_callout_subtext', { group: 'home_fincobiz_group', sort: 3 }),
      input('fincobiz_card_request', { group: 'home_fincobiz_group', sort: 4, note: 'Card-deck tab title.' }),
      input('fincobiz_card_receivables', { group: 'home_fincobiz_group', sort: 5, note: 'Card-deck tab title.' }),
      input('fincobiz_card_eligibility', { group: 'home_fincobiz_group', sort: 6, note: 'Card-deck tab title.' }),
    ],
    legacy: ['hero', 'value_props', 'beep', 'fincobiz'],
    explode: (r) => ({
      hero_eyebrow: r.hero?.eyebrow ?? null,
      hero_headline: r.hero?.headline ?? null,
      hero_accent: r.hero?.accent ?? null,
      hero_subheadline: r.hero?.subheadline ?? null,
      hero_cta_label: r.hero?.cta?.label ?? null,
      hero_cta_to: r.hero?.cta?.to ?? null,
      hero_secondary_cta_label: r.hero?.secondaryCta?.label ?? null,
      hero_secondary_cta_to: r.hero?.secondaryCta?.to ?? null,
      value_props_heading: r.value_props?.heading ?? null,
      value_props_accent: r.value_props?.accent ?? null,
      value_props_subheading: r.value_props?.subheading ?? null,
      value_props_items: r.value_props?.items ?? null,
      beep_heading: r.beep?.heading ?? null,
      beep_subtext: r.beep?.subtext ?? null,
      beep_expand_lead: r.beep?.expandLead ?? null,
      beep_expand_rest: r.beep?.expandRest ?? null,
      beep_teaser: r.beep?.teaser ?? null,
      beep_download_label: r.beep?.downloadLabel ?? null,
      fincobiz_subtext: r.fincobiz?.subtext ?? null,
      fincobiz_callout_heading: r.fincobiz?.calloutHeading ?? null,
      fincobiz_callout_subtext: r.fincobiz?.calloutSubtext ?? null,
      fincobiz_card_request: r.fincobiz?.cards?.request ?? null,
      fincobiz_card_receivables: r.fincobiz?.cards?.receivables ?? null,
      fincobiz_card_eligibility: r.fincobiz?.cards?.eligibility ?? null,
    }),
    assemble: (r) => ({
      hero: strip({
        eyebrow: r.hero_eyebrow,
        headline: r.hero_headline,
        accent: r.hero_accent,
        subheadline: r.hero_subheadline,
        cta: linkObj(r.hero_cta_label, r.hero_cta_to),
        secondaryCta: linkObj(r.hero_secondary_cta_label, r.hero_secondary_cta_to),
      }),
      value_props: strip({
        heading: r.value_props_heading,
        accent: r.value_props_accent,
        subheading: r.value_props_subheading,
        items: r.value_props_items ?? undefined,
      }),
      beep: strip({ heading: r.beep_heading, subtext: r.beep_subtext, expandLead: r.beep_expand_lead, expandRest: r.beep_expand_rest, teaser: r.beep_teaser, downloadLabel: r.beep_download_label }),
      fincobiz: strip({
        subtext: r.fincobiz_subtext,
        calloutHeading: r.fincobiz_callout_heading,
        calloutSubtext: r.fincobiz_callout_subtext,
        cards: strip({ request: r.fincobiz_card_request, receivables: r.fincobiz_card_receivables, eligibility: r.fincobiz_card_eligibility }),
      }),
    }),
    normalizeLegacy: (legacy) => {
      const view = {
        hero: legacy.hero ? strip({ ...legacy.hero, image: undefined }) : undefined,
        value_props: legacy.value_props ?? undefined,
        beep: legacy.beep ?? undefined,
        fincobiz: legacy.fincobiz ?? undefined,
      }
      return view
    },
  },
  {
    collection: 'products_translations',
    fields: [
      input('loan_amount', { sort: 60, note: 'Display string, e.g. "300 сая₮ хүртэл".' }),
      input('loan_rate', { sort: 61, note: 'Display string, e.g. "3.3%/сар".' }),
      input('loan_period', { sort: 62, note: 'Display string, e.g. "60 сар хүртэл".' }),
      repeater('tabs_requirements', [['text', 'input-multiline', 'text']], { sort: 80, template: '{{text}}', note: 'Rows of the "Requirements" tab.' }),
      text('tabs_other', { sort: 81, note: 'Content of the "Other" tab.' }),
    ],
    legacy: ['loan_terms', 'tabs'],
    explode: (r) => ({
      loan_amount: r.loan_terms?.amount ?? null,
      loan_rate: r.loan_terms?.rate ?? null,
      loan_period: r.loan_terms?.period ?? null,
      tabs_requirements: wrapText(r.tabs?.requirements),
      tabs_other: r.tabs?.other ?? null,
    }),
    assemble: (r) => ({
      loan_terms: strip({ amount: r.loan_amount, rate: r.loan_rate, period: r.loan_period }),
      tabs: strip({ requirements: unwrapText(r.tabs_requirements), other: r.tabs_other }),
    }),
    normalizeLegacy: (legacy) => ({
      loan_terms: legacy.loan_terms ?? undefined,
      tabs: legacy.tabs ? strip({ requirements: legacy.tabs.requirements, other: legacy.tabs.other }) : undefined,
    }),
  },
  {
    collection: 'services_translations',
    fields: [
      input('cta_label', { sort: 40, note: 'Hero CTA pill text.' }),
      input('cta_to', { sort: 41, note: 'Hero CTA route, e.g. /branches.' }),
    ],
    legacy: ['cta'],
    explode: (r) => ({ cta_label: r.cta?.label ?? null, cta_to: r.cta?.to ?? null }),
    assemble: (r) => ({ cta: linkObj(r.cta_label, r.cta_to) }),
  },
  {
    collection: 'branches',
    fields: [
      float('pin_x', { note: 'Pin position across the map image, 0–1 from the left.' }),
      float('pin_y', { note: 'Pin position down the map image, 0–1 from the top.' }),
    ],
    legacy: ['pin'],
    explode: (r) => ({ pin_x: r.pin?.x ?? null, pin_y: r.pin?.y ?? null }),
    assemble: (r) => ({ pin: r.pin_x == null && r.pin_y == null ? undefined : { x: r.pin_x, y: r.pin_y } }),
  },
]

const JOBS_INTERFACES = [
  repeater('requirements', [['text', 'input-multiline', 'text']], { template: '{{text}}', note: 'One row per requirement.' }),
  repeater('responsibilities', [['text', 'input-multiline', 'text']], { template: '{{text}}', note: 'One row per responsibility.' }),
  repeater('application_sections', [
    ['id', 'input', 'string', { placeholder: 'general | experience | other | attachments' }],
    ['title'],
    ['fields', 'list', 'json', {
      template: '{{label}}',
      fields: [
        { field: 'name', name: 'name', type: 'string', meta: { field: 'name', interface: 'input', width: 'half' } },
        { field: 'label', name: 'label', type: 'string', meta: { field: 'label', interface: 'input', width: 'half' } },
        { field: 'type', name: 'type', type: 'string', meta: { field: 'type', interface: 'select-dropdown', width: 'half', options: { choices: ['text', 'email', 'tel', 'textarea', 'select', 'file', 'date'].map((c) => ({ text: c, value: c })) } } },
        { field: 'required', name: 'required', type: 'boolean', meta: { field: 'required', interface: 'boolean', width: 'half' } },
        { field: 'options', name: 'options', type: 'json', meta: { field: 'options', interface: 'tags', width: 'full', note: 'Choices for select fields.' } },
      ],
    }],
  ], { template: '{{title}}', note: 'Steps of the application form; each step has its own fields.' }),
]

if (!token) {
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set DIRECTUS_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD.')
    process.exit(1)
  }
  token = (await api('POST', '/auth/login', { email, password })).access_token
}
console.log(`\nJSON-field flattening on ${BASE}\n`)

const pageId = Object.fromEntries((await api('GET', '/items/pages?limit=-1&fields=id,key')).map((p) => [p.key, p.id]))
const heroGroup = SPECS[0].groups.find((g) => g.field === 'hero_group')
heroGroup.meta.hidden = true
heroGroup.meta.conditions = [{
  name: 'non-about pages',
  rule: { pages_id: { _in: ['home', 'products', 'business', 'branches', 'careers'].map((k) => pageId[k]) } },
  hidden: false,
}]

let failures = 0
for (const spec of SPECS) {
  const C = spec.collection
  console.log(`[${C}]`)

  for (const fld of [...(spec.groups ?? []), ...spec.fields]) {
    if (await exists(`/fields/${C}/${fld.field}`)) log('skip', `${fld.field} exists`)
    else {
      await api('POST', `/fields/${C}`, fld)
      log('add', `field ${fld.field}`)
    }
  }

  const newFieldNames = spec.fields.map((x) => x.field)
  const liveLegacy = []
  for (const f of spec.legacy) if (await exists(`/fields/${C}/${f}`)) liveLegacy.push(f)
  spec.legacy = liveLegacy
  if (!liveLegacy.length) {
    log('skip', 'legacy columns already dropped — nothing to migrate')
    continue
  }
  const allFields = ['id', ...spec.legacy, ...newFieldNames]
  const rows = await api('GET', `/items/${C}?limit=-1&fields=${allFields.join(',')}`)
  for (const row of rows) {
    const label = `${C}#${row.id}`
    const hasLegacy = spec.legacy.some((f) => row[f] != null)
    if (!hasLegacy) {
      log('skip', `${label}: no legacy JSON`)
      continue
    }
    const migrated = newFieldNames.some((f) => row[f] != null)
    if (migrated && !FORCE) {
      log('skip', `${label}: already migrated`)
      continue
    }
    await api('PATCH', `/items/${C}/${row.id}`, spec.explode(row))
    log('add', `${label}: exploded ${spec.legacy.join('/')}`)
    const fresh = await api('GET', `/items/${C}/${row.id}?fields=${allFields.join(',')}`)
    const legacyView = spec.normalizeLegacy
      ? spec.normalizeLegacy(fresh)
      : Object.fromEntries(spec.legacy.map((f) => [f, fresh[f] ?? undefined]))
    const want = stable(strip(legacyView) ?? {})
    const got = stable(strip(spec.assemble(fresh)) ?? {})
    if (want === got) log('add', `${label}: verified`)
    else {
      failures++
      console.error(`  ! ${label}: MISMATCH\n      want ${want}\n      got  ${got}`)
    }
  }

  for (const f of spec.legacy) {
    await api('PATCH', `/fields/${C}/${f}`, {
      meta: { readonly: true, hidden: true, note: 'DEPRECATED — replaced by structured fields. Removed after deploy verification.' },
    })
  }
  log('add', `legacy hidden: ${spec.legacy.join(', ')}`)
}

console.log('[jobs_translations]')
for (const fld of JOBS_INTERFACES) {
  await api('PATCH', `/fields/jobs_translations/${fld.field}`, { meta: { interface: fld.meta.interface, special: fld.meta.special, options: fld.meta.options, note: fld.meta.note } })
  log('add', `interface: ${fld.field} -> repeater`)
}
{
  const rows = await api('GET', '/items/jobs_translations?limit=-1&fields=id,requirements,responsibilities')
  for (const row of rows) {
    const needs = (v) => Array.isArray(v) && v.some((x) => typeof x === 'string')
    if (!needs(row.requirements) && !needs(row.responsibilities)) {
      log('skip', `jobs_translations#${row.id}: already wrapped`)
      continue
    }
    await api('PATCH', `/items/jobs_translations/${row.id}`, {
      requirements: wrapText(row.requirements),
      responsibilities: wrapText(row.responsibilities),
    })
    log('add', `jobs_translations#${row.id}: wrapped string rows`)
  }
}

if (failures) {
  console.error(`\n${failures} verification failure(s) — DO NOT --drop-legacy until resolved.`)
  process.exit(1)
}

if (DROP) {
  console.log('[drop-legacy]')
  for (const spec of SPECS) {
    for (const f of spec.legacy) {
      if (await exists(`/fields/${spec.collection}/${f}`)) {
        await api('DELETE', `/fields/${spec.collection}/${f}`)
        log('add', `deleted ${spec.collection}.${f}`)
      } else log('skip', `${spec.collection}.${f} already gone`)
    }
  }
}

console.log(`
Done. Next:
  1. Spot-check in Studio: pages (hero group, home sub-groups), a product
     (loan fields + requirements repeater), a job (nested application form).
  2. Deploy the app (normalizers read the new fields, falling back to legacy).
  3. Verify prod, then re-run with --drop-legacy (and setup-about-restructure.mjs --drop-blob).
  4. make snapshot-directus  -> commit directus/schema.yaml
`)
