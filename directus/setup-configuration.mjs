#!/usr/bin/env node
/**
 * Creates the `configuration` collection: flat key/value settings for the whole
 * site (contact details, social links, …). Seeds the first five keys.
 * Idempotent — existing objects are skipped, never mutated, and existing values
 * are left alone so a re-run can never overwrite what an editor typed.
 *
 * Usage (from your machine):
 *   DIRECTUS_URL=https://cms.finco.design \
 *   DIRECTUS_TOKEN=<admin static token> \
 *   node directus/setup-configuration.mjs
 *
 * Auth: DIRECTUS_TOKEN (admin static token) or DIRECTUS_ADMIN_EMAIL +
 * DIRECTUS_ADMIN_PASSWORD, same as the other setup scripts.
 *
 * NOT translated, deliberately. A phone number, an address line and a Facebook
 * URL are the same string in every locale, and a translations table would make
 * every one of them a two-row edit that silently half-publishes. Anything that
 * genuinely differs per language belongs in `pages` with the rest of the copy.
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
// 1. configuration collection
// ---------------------------------------------------------------------------
console.log('[1/3] configuration collection')
if (await exists('/collections/configuration')) {
  log('skip', 'collection configuration exists')
} else {
  await api('POST', '/collections', {
    collection: 'configuration',
    meta: {
      icon: 'settings',
      display_template: '{{key}}',
      note: 'Site-wide key/value settings (contact details, social links). Not translated — the same value is used in every locale.',
      sort_field: 'sort',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      archive_app_filter: true,
      accountability: 'all',
    },
    schema: {},
    fields: [
      {
        // The key IS the primary key: it is what code looks a setting up by, so
        // a separate uuid would just be a second identifier that can drift.
        field: 'key',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          width: 'half',
          options: { slug: true, slugSeparator: '_', trim: true },
          note: 'Referenced from code — never rename a key that is in use. Lowercase with underscores, e.g. contact_phone.',
        },
        schema: { is_primary_key: true, length: 64, has_auto_increment: false },
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: '$t:published', value: 'published' },
              { text: '$t:draft', value: 'draft' },
              { text: '$t:archived', value: 'archived' },
            ],
          },
          note: 'Only published entries reach the site.',
        },
        schema: { default_value: 'draft', is_nullable: false },
      },
      {
        field: 'value',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          required: true,
          width: 'full',
          note: 'The value as it should appear on the site. Phone numbers keep their spacing; links need the full https:// URL.',
        },
        schema: { is_nullable: false },
      },
      {
        field: 'label',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          note: 'What this setting is, in plain language. Editor-facing only — never rendered.',
        },
        schema: {},
      },
      {
        field: 'sort',
        type: 'integer',
        meta: { interface: 'input', hidden: true, width: 'half' },
        schema: {},
      },
      {
        field: 'user_created',
        type: 'uuid',
        meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' },
        schema: {},
      },
      {
        field: 'date_created',
        type: 'timestamp',
        meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
        schema: {},
      },
      {
        field: 'user_updated',
        type: 'uuid',
        meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half' },
        schema: {},
      },
      {
        field: 'date_updated',
        type: 'timestamp',
        meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half' },
        schema: {},
      },
    ],
  })
  log('add', 'created collection configuration')
}

// ---------------------------------------------------------------------------
// 2. seed rows
// ---------------------------------------------------------------------------
// Kept in sync with content/configuration/*.yml — the @nuxt/content fallback the
// site reads when NUXT_PUBLIC_CMS_PROVIDER is not 'directus'.
console.log('[2/3] seed entries')
const SEEDS = [
  { key: 'contact_phone', sort: 1, label: 'Contact phone number', value: '+976 7070 1212' },
  { key: 'contact_email', sort: 2, label: 'Contact email address', value: 'contact@finco.mn' },
  // Empty on purpose: nobody should invent a social URL. Fill these in the
  // admin; until then the site falls back to hiding the icon.
  { key: 'social_facebook', sort: 3, label: 'Facebook page URL', value: '' },
  { key: 'social_instagram', sort: 4, label: 'Instagram profile URL', value: '' },
  { key: 'social_youtube', sort: 5, label: 'YouTube channel URL', value: '' },
]

for (const seed of SEEDS) {
  if (await findOne('/items/configuration', { key: seed.key })) {
    log('skip', `entry ${seed.key} exists (value left untouched)`)
  } else {
    await api('POST', '/items/configuration', { ...seed, status: 'published' })
    log('add', `created entry ${seed.key}`)
  }
}

// ---------------------------------------------------------------------------
// 3. permissions
// ---------------------------------------------------------------------------
// API Read Policy: published-only, matching every other public collection.
// Editors/Publishers: no `_translations` table here, so this is the plain
// single-collection version of the loop in setup-phase2.mjs.
console.log('[3/3] permissions')

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

const readPolicy = await findOne('/policies', { name: 'API Read Policy' })
if (readPolicy) {
  await ensurePermission(readPolicy.id, {
    collection: 'configuration',
    action: 'read',
    fields: ['*'],
    permissions: { status: { _eq: 'published' } },
  })
} else {
  console.warn('  ! API Read Policy not found — run setup-api-reader.mjs, then re-run this script.')
}

const editorPolicy = await findOne('/policies', { name: 'Editor Policy' })
const publisherPolicy = await findOne('/policies', { name: 'Publisher Policy' })
if (editorPolicy && publisherPolicy) {
  // Editor: may add a key and edit drafts, never flips status.
  const editorFields = ['key', 'value', 'label', 'sort']
  await ensurePermission(editorPolicy.id, { collection: 'configuration', action: 'create', fields: editorFields, permissions: null })
  await ensurePermission(editorPolicy.id, { collection: 'configuration', action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(editorPolicy.id, { collection: 'configuration', action: 'update', fields: editorFields, permissions: { status: { _eq: 'draft' } } })
  // Publisher: full CRU, no hard delete — archive instead, same as elsewhere.
  await ensurePermission(publisherPolicy.id, { collection: 'configuration', action: 'create', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: 'configuration', action: 'read', fields: ['*'], permissions: null })
  await ensurePermission(publisherPolicy.id, { collection: 'configuration', action: 'update', fields: ['*'], permissions: null })
} else {
  console.warn('  ! Editor/Publisher policies not found — run setup-phase1.mjs, then re-run this script.')
}

console.log(`
Done.

Next:
  1. Fill in the three social URLs in the admin (they are seeded empty).
  2. Snapshot the schema and commit it:
       npx directus schema snapshot ./directus/schema.yaml
  3. Point the Directus revalidate Flow at this collection too, so edits purge
     the Worker cache instead of waiting out the 60s TTL.
`)
