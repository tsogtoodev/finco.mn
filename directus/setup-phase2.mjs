#!/usr/bin/env node
/**
 * Phase 2 provisioning: the remaining collections + permissions.
 * Mirrors content.config.ts. Idempotent — safe to re-run.
 *
 * Creates (14 new, → 17 total custom with phase 1's 3):
 *   products, products_translations, products_related (m2m junction)
 *   services, services_translations, services_related (junction → products)
 *   branches, branches_translations
 *   jobs, jobs_translations
 *   legal, legal_translations
 *   pages, pages_translations
 * plus Editor/Publisher permissions for all of them.
 *
 * Shape rules (so the frontend adapter + seed stay simple):
 *   - object-arrays (faq, stats, timeline, …) -> list repeater (same JSON shape, good UX)
 *   - nested objects & string-arrays (tabs, about, requirements, …) -> raw JSON field (exact shape)
 *
 * Usage:  DIRECTUS_URL=... DIRECTUS_TOKEN=... node directus/setup-phase2.mjs
 */

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
let token = process.env.DIRECTUS_TOKEN ?? null

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
async function findOne(path, filter) {
  const qs = Object.entries(filter)
    .map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`)
    .join('&')
  const data = await api('GET', `${path}?${qs}&limit=1`)
  return data?.[0] ?? null
}
function log(step, msg) {
  console.log(`  ${step === 'skip' ? '=' : '+'} ${msg}`)
}

// ---------------------------------------------------------------------------
// Field builders
// ---------------------------------------------------------------------------
const f = {
  uuidPk: () => ({
    field: 'id',
    type: 'uuid',
    meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
    schema: { is_primary_key: true, has_auto_increment: false },
  }),
  status: () => ({
    field: 'status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      width: 'full',
      options: {
        choices: [
          { text: '$t:published', value: 'published' },
          { text: '$t:draft', value: 'draft' },
          { text: '$t:archived', value: 'archived' },
        ],
      },
    },
    schema: { default_value: 'draft', is_nullable: false },
  }),
  accountability: () => [
    { field: 'user_created', type: 'uuid', meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' }, schema: {} },
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' }, schema: {} },
    { field: 'user_updated', type: 'uuid', meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' }, schema: {} },
    { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' }, schema: {} },
  ],
  slug: (note) => ({
    field: 'slug',
    type: 'string',
    meta: { interface: 'input', required: true, width: 'half', options: { slug: true, trim: true }, note: note ?? 'Shared across languages. Never change after publish.' },
    schema: { is_nullable: false, is_unique: true },
  }),
  input: (field, opts = {}) => ({
    field,
    type: 'string',
    meta: { interface: 'input', width: opts.width ?? 'half', required: opts.required ?? false, note: opts.note },
    schema: opts.required ? { is_nullable: false } : {},
  }),
  text: (field, opts = {}) => ({
    field,
    type: 'text',
    meta: { interface: 'input-multiline', width: 'full', required: opts.required ?? false, note: opts.note },
    schema: opts.required ? { is_nullable: false } : {},
  }),
  markdown: (field, opts = {}) => ({
    field,
    type: 'text',
    meta: { interface: 'input-rich-text-md', width: 'full', required: opts.required ?? false, note: opts.note ?? 'Markdown. Rendered by the site.' },
    schema: opts.required ? { is_nullable: false } : {},
  }),
  integer: (field, opts = {}) => ({
    field,
    type: 'integer',
    meta: { interface: 'input', width: 'half', note: opts.note },
    schema: {},
  }),
  float: (field, opts = {}) => ({
    field,
    type: 'float',
    meta: { interface: 'input', width: 'half', required: opts.required ?? false, note: opts.note },
    schema: {},
  }),
  boolean: (field, opts = {}) => ({
    field,
    type: 'boolean',
    meta: { interface: 'boolean', width: 'half', note: opts.note },
    schema: { default_value: false },
  }),
  datetime: (field, opts = {}) => ({
    field,
    type: 'timestamp',
    meta: { interface: 'datetime', width: 'half', required: opts.required ?? false, display: 'datetime', note: opts.note },
    schema: opts.required ? { is_nullable: false } : {},
  }),
  dropdown: (field, choices, opts = {}) => ({
    field,
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      required: opts.required ?? false,
      options: { choices: choices.map((c) => ({ text: c, value: c })) },
      note: opts.note,
    },
    schema: opts.required ? { is_nullable: false, ...(opts.unique ? { is_unique: true } : {}) } : opts.unique ? { is_unique: true } : {},
  }),
  json: (field, opts = {}) => ({
    field,
    type: 'json',
    meta: { interface: 'input-code', special: ['cast-json'], width: 'full', options: { language: 'json' }, note: opts.note },
    schema: {},
  }),
  repeater: (field, subfields, opts = {}) => ({
    field,
    type: 'json',
    meta: {
      interface: 'list',
      special: ['cast-json'],
      width: 'full',
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
  }),
}

const faqRepeater = () =>
  f.repeater('faq', [['question', 'input'], ['answer', 'input-multiline', 'text']], { template: '{{question}}' })

// file fields need a follow-up relation; declared separately
const FILE_FIELDS = {
  products: ['hero_image', 'card_image'],
  services: ['hero_image'],
  branches: ['photo', 'map_image'],
}

// ---------------------------------------------------------------------------
// Collection definitions (mirrors content.config.ts)
// ---------------------------------------------------------------------------
const COLLECTIONS = {
  products: {
    icon: 'shopping_bag',
    display: '{{slug}}',
    sortField: 'order',
    base: [
      f.slug(),
      f.dropdown('audience', ['individual', 'business'], { required: true }),
      f.boolean('featured', { note: 'Shown in the home products carousel.' }),
      f.integer('order'),
    ],
    translations: [
      f.input('title', { required: true, width: 'full' }),
      f.input('menu_title', { note: 'Mega-menu override (may carry decorations like 🍀).' }),
      f.input('menu_desc', { note: 'One-liner under the menu link; falls back to summary.' }),
      f.text('summary'),
      f.input('category', { note: 'Chip label, e.g. "Ногоон зээл".' }),
      f.json('loan_terms', { note: 'Object: { amount, rate, period } — localized display strings.' }),
      f.json('tabs', { note: 'Object: { info, requirements: string[], other }.' }),
      f.markdown('body', { note: 'Markdown. Rendered as the "info" tab on the product detail page.' }),
      faqRepeater(),
    ],
    m2m: { field: 'related', junction: 'products_related', junctionFields: ['products_id', 'related_products_id'], related: 'products' },
  },
  services: {
    icon: 'handshake',
    display: '{{slug}}',
    sortField: 'order',
    base: [f.slug(), f.integer('order')],
    translations: [
      f.input('title', { required: true, width: 'full' }),
      f.input('breadcrumb', { note: 'Short label for the breadcrumb (≠ headline).' }),
      f.text('summary'),
      f.json('cta', { note: 'Object: { label, to } — hero CTA pill.' }),
      faqRepeater(),
    ],
    m2m: { field: 'related', junction: 'services_related', junctionFields: ['services_id', 'products_id'], related: 'products' },
  },
  branches: {
    icon: 'location_on',
    display: '{{slug}}',
    sortField: 'order',
    base: [
      f.slug(),
      f.integer('order'),
      f.json('pin', { note: 'Object: { x, y } — normalised 0–1 pin position on the map image.' }),
      f.float('latitude', { required: true }),
      f.float('longitude', { required: true }),
    ],
    translations: [
      f.input('name', { required: true, width: 'full' }),
      f.input('address', { required: true, width: 'full' }),
      f.input('phone'),
      f.input('hours'),
      f.input('caption', { note: 'Overlay label on the branch photo.' }),
    ],
  },
  jobs: {
    icon: 'work',
    display: '{{slug}}',
    base: [f.slug(), f.datetime('posted_at')],
    translations: [
      f.input('title', { required: true, width: 'full' }),
      f.input('department'),
      f.input('location'),
      f.input('employment_type', { note: 'e.g. full-time.' }),
      f.text('summary'),
      f.json('requirements', { note: 'Array of strings.' }),
      f.json('responsibilities', { note: 'Array of strings.' }),
      f.json('application_sections', { note: 'Multi-step application form schema (see content.config.ts).' }),
    ],
  },
  legal: {
    icon: 'gavel',
    display: '{{slug}}',
    base: [f.slug(), f.datetime('updated_at', { note: 'Last-revised date, shown under the title.' })],
    translations: [
      f.input('title', { required: true, width: 'full' }),
      f.text('summary'),
      f.markdown('body', { required: true }),
    ],
  },
  pages: {
    icon: 'web',
    display: '{{key}}',
    base: [
      f.dropdown('key', ['home', 'about', 'products', 'business', 'branches', 'careers'], {
        required: true,
        unique: true,
        note: 'Which page this record drives. One record per key.',
      }),
    ],
    translations: [
      f.json('hero', { note: 'Object: eyebrow/headline/accent/subheadline/cta/secondaryCta/image.' }),
      f.repeater('stats', [['value', 'input', 'integer'], ['prefix'], ['suffix'], ['label']], { template: '{{label}}' }),
      f.input('stats_heading', { width: 'full' }),
      f.json('value_props', { note: 'Bento value-prop block (heading/accent/subheading/items).' }),
      f.repeater('hero_slides', [['key'], ['tab'], ['headline'], ['subtext', 'input-multiline', 'text']], { template: '{{key}}: {{headline}}' }),
      f.json('beep', { note: 'Beep showcase copy.' }),
      f.json('fincobiz', { note: 'FincoBiz showcase copy incl. card-deck tab titles.' }),
      f.repeater('showcases', [['theme'], ['eyebrow'], ['title'], ['body', 'input-multiline', 'text'], ['image']], { template: '{{title}}' }),
      f.json('cta', { note: 'Closing CTA banner: { heading, body, button }.' }),
      f.repeater('timeline', [['year'], ['title'], ['body', 'input-multiline', 'text']], { template: '{{year}} {{title}}' }),
      f.repeater('perks', [['title'], ['body', 'input-multiline', 'text'], ['icon']], { template: '{{title}}' }),
      f.json('leadership', { note: 'Object: { name, role, quote, photo }.' }),
      f.repeater('team', [['name'], ['role'], ['bio', 'input-multiline', 'text'], ['avatar']], { template: '{{name}}' }),
      f.repeater('sections', [['id'], ['heading'], ['body', 'input-multiline', 'text']], { template: '{{id}}' }),
      faqRepeater(),
      f.json('about', { note: 'About page structure (hero/mission/values/history/ceo/board/org). Only on the about record.' }),
    ],
  },
}

// ---------------------------------------------------------------------------
// Generic creators
// ---------------------------------------------------------------------------
async function ensureCollection(name, payload) {
  if (await exists(`/collections/${name}`)) {
    log('skip', `collection ${name} exists`)
    return false
  }
  await api('POST', '/collections', payload)
  log('add', `created collection ${name}`)
  return true
}

async function ensureRelation(collection, field, payload) {
  if (await exists(`/relations/${collection}/${field}`)) {
    log('skip', `relation ${collection}.${field} exists`)
  } else {
    await api('POST', '/relations', { collection, field, ...payload })
    log('add', `relation ${collection}.${field} -> ${payload.related_collection}`)
  }
}

async function ensureField(collection, payload) {
  if (await exists(`/fields/${collection}/${payload.field}`)) {
    log('skip', `field ${collection}.${payload.field} exists`)
    return false
  }
  await api('POST', `/fields/${collection}`, payload)
  log('add', `field ${collection}.${payload.field}`)
  return true
}

// ---------------------------------------------------------------------------
// Auth
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
console.log(`\nProvisioning Phase 2 on ${BASE}\n`)

// ---------------------------------------------------------------------------
// Collections, translations, relations
// ---------------------------------------------------------------------------
for (const [name, def] of Object.entries(COLLECTIONS)) {
  console.log(`[${name}]`)

  await ensureCollection(name, {
    collection: name,
    meta: {
      icon: def.icon,
      display_template: def.display,
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      archive_app_filter: true,
      accountability: 'all',
      versioning: true,
      ...(def.sortField ? { sort_field: def.sortField } : {}),
    },
    schema: {},
    fields: [f.uuidPk(), f.status(), ...def.base, ...f.accountability()],
  })

  for (const field of ['user_created', 'user_updated']) {
    await ensureRelation(name, field, { related_collection: 'directus_users', schema: { on_delete: 'NO ACTION' } })
  }

  // single-file image fields
  for (const fileField of FILE_FIELDS[name] ?? []) {
    const created = await ensureField(name, {
      field: fileField,
      type: 'uuid',
      meta: { interface: 'file-image', special: ['file'], width: 'half', note: 'Stored in R2.' },
      schema: {},
    })
    if (created) {
      await ensureRelation(name, fileField, { related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } })
    }
  }

  // translations
  const tName = `${name}_translations`
  await ensureCollection(tName, {
    collection: tName,
    meta: { icon: 'import_export', hidden: true, display_template: def.translations.some((x) => x.field === 'title') ? '{{title}}' : undefined },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: `${name}_id`, type: 'uuid', meta: { hidden: true }, schema: {} },
      { field: 'languages_code', type: 'string', meta: { hidden: true }, schema: { length: 8 } },
      ...def.translations,
    ],
  })
  // self-heal: add any translation fields introduced after the collection was created
  for (const fld of def.translations) await ensureField(tName, fld)
  await ensureField(name, {
    field: 'translations',
    type: 'alias',
    meta: { interface: 'translations', special: ['translations'], options: { languageField: 'name', defaultLanguage: 'mn' }, width: 'full' },
  })
  await ensureRelation(tName, `${name}_id`, {
    related_collection: name,
    meta: { one_field: 'translations', junction_field: 'languages_code' },
    schema: { on_delete: 'CASCADE' },
  })
  await ensureRelation(tName, 'languages_code', {
    related_collection: 'languages',
    meta: { junction_field: `${name}_id` },
    schema: { on_delete: 'CASCADE' },
  })

  // m2m related
  if (def.m2m) {
    const { field, junction, junctionFields, related } = def.m2m
    const [ownField, otherField] = junctionFields
    await ensureCollection(junction, {
      collection: junction,
      meta: { icon: 'link', hidden: true },
      schema: {},
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: ownField, type: 'uuid', meta: { hidden: true }, schema: {} },
        { field: otherField, type: 'uuid', meta: { hidden: true }, schema: {} },
      ],
    })
    await ensureField(name, {
      field,
      type: 'alias',
      meta: { interface: 'list-m2m', special: ['m2m'], width: 'full', note: 'Related products (ordered).' },
    })
    await ensureRelation(junction, ownField, {
      related_collection: name,
      meta: { one_field: field, junction_field: otherField },
      schema: { on_delete: 'CASCADE' },
    })
    await ensureRelation(junction, otherField, {
      related_collection: related,
      meta: { junction_field: ownField },
      schema: { on_delete: 'CASCADE' },
    })
  }
}

// ---------------------------------------------------------------------------
// Permissions for both policies
// ---------------------------------------------------------------------------
console.log('[permissions]')
const editorPolicy = await findOne('/policies', { name: 'Editor Policy' })
const publisherPolicy = await findOne('/policies', { name: 'Publisher Policy' })
if (!editorPolicy || !publisherPolicy) {
  console.error('Editor/Publisher policies not found — run setup-phase1.mjs first.')
  process.exit(1)
}

async function ensurePermission(policyId, perm) {
  const existing = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${perm.collection}&filter[action][_eq]=${perm.action}&limit=1`,
  )
  if (existing?.length) {
    log('skip', `  ${perm.collection}.${perm.action}`)
  } else {
    await api('POST', '/permissions', { policy: policyId, validation: null, presets: null, ...perm })
    log('add', `  ${perm.collection}.${perm.action}`)
  }
}

for (const [name, def] of Object.entries(COLLECTIONS)) {
  const tName = `${name}_translations`
  const editorFields = [
    ...def.base.map((x) => x.field),
    ...(FILE_FIELDS[name] ?? []),
    'translations',
    ...(def.m2m ? [def.m2m.field] : []),
  ]

  // Editor: draft-only, never status
  await ensurePermission(editorPolicy.id, { collection: name, action: 'create', fields: editorFields, permissions: null })
  await ensurePermission(editorPolicy.id, { collection: name, action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: name, action: 'update', fields: editorFields, permissions: { status: { _eq: 'draft' } } })
  await ensurePermission(editorPolicy.id, { collection: tName, action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: tName, action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: tName, action: 'update', fields: ['*'], permissions: { [`${name}_id`]: { status: { _eq: 'draft' } } } })

  // Publisher: full CRU on base (no hard delete — archive), full on translations
  await ensurePermission(publisherPolicy.id, { collection: name, action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: name, action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: name, action: 'update', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: tName, action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: tName, action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: tName, action: 'update', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: tName, action: 'delete', fields: ['*'], permissions: null })

  // junction permissions (adding/removing related products)
  if (def.m2m) {
    const j = def.m2m.junction
    const parentDraftRule = { [def.m2m.junctionFields[0]]: { status: { _eq: 'draft' } } }
    await ensurePermission(editorPolicy.id, { collection: j, action: 'create', fields: ['*'], permissions: null })
    await ensurePermission(editorPolicy.id, { collection: j, action: 'read', fields: ['*'], permissions: null })
    await ensurePermission(editorPolicy.id, { collection: j, action: 'delete', fields: ['*'], permissions: parentDraftRule })
    for (const action of ['create', 'read', 'update', 'delete']) {
      await ensurePermission(publisherPolicy.id, { collection: j, action, fields: ['*'], permissions: null })
    }
  }
}

console.log(`
Done. Next:
  1. Spot-check one collection in the admin (e.g. products — form layout, translations tab).
  2. Snapshot the schema:  make snapshot-directus  -> commit directus/schema.yaml
  3. Phase 2b: the seed script (directus-seed.mjs) imports the 70 content files.
`)
