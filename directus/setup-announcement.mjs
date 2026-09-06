#!/usr/bin/env node
/**
 * Creates the `announcement` collection + `announcement_translations`: the copy
 * for the site-wide promo strip above the nav. Seeds the single `bar` record
 * with the mn/en strings the bar shipped with as i18n keys.
 * Idempotent — existing objects are skipped, never mutated, and an existing
 * record's values are left alone so a re-run can never overwrite what an editor
 * typed.
 *
 * Usage (from your machine):
 *   DIRECTUS_URL=https://cms.finco.design \
 *   DIRECTUS_TOKEN=<admin static token> \
 *   node directus/setup-announcement.mjs
 *
 * Auth: DIRECTUS_TOKEN (admin static token) or DIRECTUS_ADMIN_EMAIL +
 * DIRECTUS_ADMIN_PASSWORD, same as the other setup scripts.
 *
 * TRANSLATED, unlike `configuration`. The strip is copy — it reads differently
 * in every language — so it gets the usual base + _translations pair rather
 * than the flat key/value shape the contact details use.
 *
 * Shape mirrors the `pages` collection from setup-phase2.mjs: uuid PK, a `key`
 * dropdown selecting which strip the record drives (one value today, 'bar'),
 * and an `announcement_id` junction so setup-api-reader.mjs's `<name>_id`
 * convention applies unchanged.
 *
 * After it succeeds: snapshot the schema (see PHASE1-SETUP.md §6) and commit
 * directus/schema.yaml.
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

async function ensureField(collection, field) {
  if (await exists(`/fields/${collection}/${field.field}`)) {
    log('skip', `field ${collection}.${field.field}`)
    return false
  }
  await api('POST', `/fields/${collection}`, field)
  log('add', `field ${collection}.${field.field}`)
  return true
}

async function ensureRelation(collection, field, rel) {
  if (await exists(`/relations/${collection}/${field}`)) {
    log('skip', `relation ${collection}.${field}`)
    return
  }
  await api('POST', '/relations', { collection, field, ...rel })
  log('add', `relation ${collection}.${field} -> ${rel.related_collection}`)
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
  const auth = await api('POST', '/auth/login', { email, password })
  token = auth.access_token
}
console.log(`\nProvisioning ${BASE}\n`)

// ---------------------------------------------------------------------------
// 1. announcement collection
// ---------------------------------------------------------------------------
console.log('[1/4] announcement collection')
if (await exists('/collections/announcement')) {
  log('skip', 'collection announcement exists')
} else {
  await api('POST', '/collections', {
    collection: 'announcement',
    meta: {
      icon: 'campaign',
      display_template: '{{key}}',
      note: 'Site-wide promo strip above the nav. One record per strip; turn it off with `enabled` rather than deleting the copy.',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      archive_app_filter: true,
      accountability: 'all',
      versioning: true,
    },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false },
      },
      {
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
      },
      {
        field: 'key',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          required: true,
          options: { choices: [{ text: 'bar', value: 'bar' }] },
          note: 'Which strip this record drives. Referenced from code — one record per key.',
        },
        schema: { is_nullable: false, is_unique: true },
      },
      {
        field: 'enabled',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          width: 'half',
          note: 'Off hides the strip on every page, in every language. The copy is kept.',
        },
        schema: { default_value: true },
      },
      {
        field: 'cta_url',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          note: 'Where the CTA goes. Internal path (/products) — the language prefix is added by the site — or a full https:// URL, which opens in a new tab. Leave empty to show the message with no link.',
        },
        schema: {},
      },
      { field: 'user_created', type: 'uuid', meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' }, schema: {} },
      { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' }, schema: {} },
      { field: 'user_updated', type: 'uuid', meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' }, schema: {} },
      { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' }, schema: {} },
    ],
  })
  log('add', 'created collection announcement')
}

// accountability relations (the app creates these automatically; the API does not)
for (const field of ['user_created', 'user_updated']) {
  await ensureRelation('announcement', field, {
    related_collection: 'directus_users',
    schema: { on_delete: 'NO ACTION' },
  })
}

// ---------------------------------------------------------------------------
// 2. announcement_translations
// ---------------------------------------------------------------------------
console.log('[2/4] announcement_translations collection')
const T_FIELDS = [
  {
    field: 'text',
    type: 'string',
    meta: {
      interface: 'input',
      required: true,
      width: 'full',
      note: 'The message. Kept short — it truncates on one line at narrow widths.',
    },
    schema: { is_nullable: false },
  },
  {
    field: 'cta_label',
    type: 'string',
    meta: { interface: 'input', width: 'half', note: 'Link text, e.g. "Дэлгэрэнгүй". Empty hides the link.' },
    schema: {},
  },
]

if (await exists('/collections/announcement_translations')) {
  log('skip', 'collection announcement_translations exists')
} else {
  await api('POST', '/collections', {
    collection: 'announcement_translations',
    meta: { icon: 'import_export', hidden: true, display_template: '{{text}}' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'announcement_id', type: 'uuid', meta: { hidden: true }, schema: {} },
      { field: 'languages_code', type: 'string', meta: { hidden: true }, schema: { length: 8 } },
      ...T_FIELDS,
    ],
  })
  log('add', 'created collection announcement_translations')
}
// self-heal: pick up translation fields introduced after the collection existed
for (const fld of T_FIELDS) await ensureField('announcement_translations', fld)

await ensureField('announcement', {
  field: 'translations',
  type: 'alias',
  meta: {
    interface: 'translations',
    special: ['translations'],
    options: { languageField: 'name', defaultLanguage: 'mn' },
    width: 'full',
  },
})
await ensureRelation('announcement_translations', 'announcement_id', {
  related_collection: 'announcement',
  meta: { one_field: 'translations', junction_field: 'languages_code' },
  schema: { on_delete: 'CASCADE' },
})
await ensureRelation('announcement_translations', 'languages_code', {
  related_collection: 'languages',
  meta: { junction_field: 'announcement_id' },
  schema: { on_delete: 'CASCADE' },
})

// ---------------------------------------------------------------------------
// 3. seed the `bar` record
// ---------------------------------------------------------------------------
// Kept in sync with content/announcement/{mn,en}/bar.yml — the @nuxt/content
// fallback the site reads when NUXT_PUBLIC_CMS_PROVIDER is not 'directus' — and
// with the announcement.* keys in i18n/locales/*.json, which remain the last
// resort if this record is missing or the CMS is unreachable.
console.log('[3/4] seed the bar record')
if (await findOne('/items/announcement', { key: 'bar' })) {
  log('skip', 'record bar exists (values left untouched)')
} else {
  await api('POST', '/items/announcement', {
    key: 'bar',
    status: 'published',
    enabled: true,
    cta_url: '/products',
    translations: [
      { languages_code: 'mn', text: 'Beep Wallet - Зээлийн нөхцөл шинэчлэгдлээ', cta_label: 'Дэлгэрэнгүй' },
      { languages_code: 'en', text: 'Beep Wallet - New loan terms are live', cta_label: 'Learn more' },
    ],
  })
  log('add', 'created record bar (mn + en)')
}

// ---------------------------------------------------------------------------
// 4. permissions
// ---------------------------------------------------------------------------
console.log('[4/4] permissions')

async function ensurePermission(policyId, perm) {
  const existing = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${perm.collection}&filter[action][_eq]=${perm.action}&limit=1`,
  )
  if (existing?.length) {
    log('skip', `${perm.collection}.${perm.action}`)
  } else {
    await api('POST', '/permissions', { policy: policyId, validation: null, presets: null, ...perm })
    log('add', `${perm.collection}.${perm.action}`)
  }
}

// API Read Policy: published-only, matching every other public collection.
const readPolicy = await findOne('/policies', { name: 'API Read Policy' })
if (readPolicy) {
  await ensurePermission(readPolicy.id, {
    collection: 'announcement',
    action: 'read',
    fields: ['*'],
    permissions: { status: { _eq: 'published' } },
  })
  await ensurePermission(readPolicy.id, {
    collection: 'announcement_translations',
    action: 'read',
    fields: ['*'],
    permissions: { announcement_id: { status: { _eq: 'published' } } },
  })
} else {
  console.warn('  ! API Read Policy not found — run setup-api-reader.mjs, then re-run this script.')
}

const editorPolicy = await findOne('/policies', { name: 'Editor Policy' })
const publisherPolicy = await findOne('/policies', { name: 'Publisher Policy' })
if (editorPolicy && publisherPolicy) {
  // Editor: edits drafts, never flips status. `key` is deliberately absent from
  // the writable list — repointing a record at another strip is a publisher call.
  const editorFields = ['enabled', 'cta_url', 'translations']
  await ensurePermission(editorPolicy.id, { collection: 'announcement', action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: 'announcement', action: 'update', fields: editorFields, permissions: { status: { _eq: 'draft' } } })
  await ensurePermission(editorPolicy.id, { collection: 'announcement_translations', action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: 'announcement_translations', action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: 'announcement_translations', action: 'update', fields: ['*'], permissions: { announcement_id: { status: { _eq: 'draft' } } } })

  // Publisher: full CRU, no hard delete — archive instead, same as elsewhere.
  await ensurePermission(publisherPolicy.id, { collection: 'announcement', action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: 'announcement', action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: 'announcement', action: 'update', fields: ['*'], permissions: null })
  for (const action of ['create', 'read', 'update', 'delete']) {
    await ensurePermission(publisherPolicy.id, { collection: 'announcement_translations', action, fields: ['*'], permissions: null })
  }
} else {
  console.warn('  ! Editor/Publisher policies not found — run setup-phase1.mjs, then re-run this script.')
}

console.log(`
Done.

Next:
  1. Open Content -> announcement -> bar in the admin and check both language tabs.
  2. Snapshot the schema and commit it:
       npx directus schema snapshot ./directus/schema.yaml
  3. Add \`announcement\` to the Directus revalidate Flow so an edit purges the
     Worker cache instead of waiting out the 60s TTL — the strip is on every
     page, so a stale one is the most visible kind of stale there is.
`)
