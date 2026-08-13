#!/usr/bin/env node

import { randomBytes } from 'node:crypto'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const WITH_TEST_USERS = process.argv.includes('--with-test-users')

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

console.log('[1/6] languages collection')
if (await exists('/collections/languages')) {
  log('skip', 'collection languages exists')
} else {
  await api('POST', '/collections', {
    collection: 'languages',
    meta: { icon: 'translate', display_template: '{{name}}', note: 'Site locales. mn is the default.' },
    schema: {},
    fields: [
      {
        field: 'code',
        type: 'string',
        meta: { interface: 'input', readonly: false, width: 'half' },
        schema: { is_primary_key: true, length: 8, has_auto_increment: false },
      },
      {
        field: 'name',
        type: 'string',
        meta: { interface: 'input', required: true, width: 'half' },
        schema: { is_nullable: false },
      },
    ],
  })
  log('add', 'created collection languages')
}
for (const item of [
  { code: 'mn', name: 'Монгол' },
  { code: 'en', name: 'English' },
]) {
  if (await findOne('/items/languages', { code: item.code })) {
    log('skip', `language ${item.code} exists`)
  } else {
    await api('POST', '/items/languages', item)
    log('add', `created language ${item.code}`)
  }
}

console.log('[2/6] news collection')
if (await exists('/collections/news')) {
  log('skip', 'collection news exists')
} else {
  await api('POST', '/collections', {
    collection: 'news',
    meta: {
      icon: 'newspaper',
      display_template: '{{slug}}',
      note: 'News articles. Translations hold all reader-facing text.',
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
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          width: 'half',
          options: { slug: true, trim: true },
          note: 'Shared across languages. Never change after publish — it is the public URL.',
        },
        schema: { is_nullable: false, is_unique: true },
      },
      {
        field: 'published_at',
        type: 'timestamp',
        meta: { interface: 'datetime', required: true, width: 'half', display: 'datetime' },
        schema: { is_nullable: false },
      },
      {
        field: 'external_url',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          note: 'If set, the news card links out instead of opening a detail page.',
        },
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
  log('add', 'created collection news (status, accountability, versioning on)')
}

for (const field of ['user_created', 'user_updated']) {
  if (await exists(`/relations/news/${field}`)) {
    log('skip', `relation news.${field} exists`)
  } else {
    await api('POST', '/relations', {
      collection: 'news',
      field,
      related_collection: 'directus_users',
      schema: { on_delete: 'NO ACTION' },
    })
    log('add', `relation news.${field} -> directus_users`)
  }
}

if (await exists('/fields/news/image')) {
  log('skip', 'field news.image exists')
} else {
  await api('POST', '/fields/news', {
    field: 'image',
    type: 'uuid',
    meta: { interface: 'file-image', special: ['file'], width: 'full', note: 'Card/hero image. Stored in R2.' },
    schema: {},
  })
  await api('POST', '/relations', {
    collection: 'news',
    field: 'image',
    related_collection: 'directus_files',
    schema: { on_delete: 'SET NULL' },
  })
  log('add', 'field news.image + relation to directus_files')
}

console.log('[3/6] news_translations collection')
if (await exists('/collections/news_translations')) {
  log('skip', 'collection news_translations exists')
} else {
  await api('POST', '/collections', {
    collection: 'news_translations',
    meta: { icon: 'import_export', hidden: true, display_template: '{{title}}' },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, interface: 'input', readonly: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
      { field: 'news_id', type: 'uuid', meta: { hidden: true }, schema: {} },
      { field: 'languages_code', type: 'string', meta: { hidden: true }, schema: { length: 8 } },
      {
        field: 'title',
        type: 'string',
        meta: { interface: 'input', required: true, width: 'full' },
        schema: { is_nullable: false },
      },
      {
        field: 'summary',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          required: true,
          width: 'full',
          note: 'Shown on cards and used as the meta description.',
        },
        schema: { is_nullable: false },
      },
      {
        field: 'body',
        type: 'text',
        meta: { interface: 'input-rich-text-md', required: true, width: 'full', note: 'Markdown. Rendered by the site.' },
        schema: { is_nullable: false },
      },
    ],
  })
  log('add', 'created collection news_translations')
}

if (await exists('/fields/news/translations')) {
  log('skip', 'field news.translations exists')
} else {
  await api('POST', '/fields/news', {
    field: 'translations',
    type: 'alias',
    meta: {
      interface: 'translations',
      special: ['translations'],
      options: { languageField: 'name', defaultLanguage: 'mn' },
      width: 'full',
    },
  })
  log('add', 'field news.translations (translations interface)')
}

if (await exists('/relations/news_translations/news_id')) {
  log('skip', 'relation news_translations.news_id exists')
} else {
  await api('POST', '/relations', {
    collection: 'news_translations',
    field: 'news_id',
    related_collection: 'news',
    meta: { one_field: 'translations', junction_field: 'languages_code' },
    schema: { on_delete: 'CASCADE' },
  })
  log('add', 'relation news_translations.news_id -> news')
}
if (await exists('/relations/news_translations/languages_code')) {
  log('skip', 'relation news_translations.languages_code exists')
} else {
  await api('POST', '/relations', {
    collection: 'news_translations',
    field: 'languages_code',
    related_collection: 'languages',
    meta: { junction_field: 'news_id' },
    schema: { on_delete: 'CASCADE' },
  })
  log('add', 'relation news_translations.languages_code -> languages')
}

console.log('[4/6] access policies')

const NEWS_EDITOR_FIELDS = ['slug', 'published_at', 'image', 'external_url', 'translations']

const POLICIES = {
  'Editor Policy': {
    meta: { icon: 'edit', app_access: true, admin_access: false },
    permissions: [
      { collection: 'news', action: 'create', fields: NEWS_EDITOR_FIELDS, permissions: null },
      { collection: 'news', action: 'read', fields: ['*'], permissions: null },
      {
        collection: 'news',
        action: 'update',
        fields: NEWS_EDITOR_FIELDS,
        permissions: { status: { _eq: 'draft' } },
      },
      { collection: 'news_translations', action: 'create', fields: ['*'], permissions: null },
      { collection: 'news_translations', action: 'read', fields: ['*'], permissions: null },
      {
        collection: 'news_translations',
        action: 'update',
        fields: ['*'],
        permissions: { news_id: { status: { _eq: 'draft' } } },
      },
      { collection: 'languages', action: 'read', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'create', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'read', fields: ['*'], permissions: null },
      {
        collection: 'directus_files',
        action: 'update',
        fields: ['*'],
        permissions: { uploaded_by: { _eq: '$CURRENT_USER' } },
      },
      { collection: 'directus_versions', action: 'create', fields: ['*'], permissions: null },
      { collection: 'directus_versions', action: 'read', fields: ['*'], permissions: null },
      {
        collection: 'directus_versions',
        action: 'update',
        fields: ['*'],
        permissions: { user_created: { _eq: '$CURRENT_USER' } },
      },
    ],
  },
  'Publisher Policy': {
    meta: { icon: 'published_with_changes', app_access: true, admin_access: false },
    permissions: [
      { collection: 'news', action: 'create', fields: ['*'], permissions: null },
      { collection: 'news', action: 'read', fields: ['*'], permissions: null },
      { collection: 'news', action: 'update', fields: ['*'], permissions: null },
      { collection: 'news_translations', action: 'create', fields: ['*'], permissions: null },
      { collection: 'news_translations', action: 'read', fields: ['*'], permissions: null },
      { collection: 'news_translations', action: 'update', fields: ['*'], permissions: null },
      { collection: 'news_translations', action: 'delete', fields: ['*'], permissions: null },
      { collection: 'languages', action: 'read', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'create', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'read', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'update', fields: ['*'], permissions: null },
      { collection: 'directus_files', action: 'delete', fields: ['*'], permissions: null },
      { collection: 'directus_versions', action: 'create', fields: ['*'], permissions: null },
      { collection: 'directus_versions', action: 'read', fields: ['*'], permissions: null },
      { collection: 'directus_versions', action: 'update', fields: ['*'], permissions: null },
      { collection: 'directus_versions', action: 'delete', fields: ['*'], permissions: null },
    ],
  },
}

const policyIds = {}
for (const [name, def] of Object.entries(POLICIES)) {
  let policy = await findOne('/policies', { name })
  if (policy) {
    log('skip', `policy "${name}" exists`)
  } else {
    policy = await api('POST', '/policies', { name, ...def.meta })
    log('add', `created policy "${name}"`)
  }
  policyIds[name] = policy.id

  for (const perm of def.permissions) {
    const existing = await api(
      'GET',
      `/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=${perm.collection}&filter[action][_eq]=${perm.action}&limit=1`,
    )
    if (existing?.length) {
      log('skip', `  ${perm.collection}.${perm.action} exists`)
    } else {
      await api('POST', '/permissions', { policy: policy.id, validation: null, presets: null, ...perm })
      log('add', `  ${perm.collection}.${perm.action}`)
    }
  }
}

console.log('[5/6] roles')
const roleIds = {}
for (const [roleName, policyName, icon] of [
  ['Editor', 'Editor Policy', 'edit'],
  ['Publisher', 'Publisher Policy', 'published_with_changes'],
]) {
  let role = await findOne('/roles', { name: roleName })
  if (role) {
    log('skip', `role ${roleName} exists`)
  } else {
    role = await api('POST', '/roles', { name: roleName, icon })
    log('add', `created role ${roleName}`)
  }
  roleIds[roleName] = role.id

  const attached = await api(
    'GET',
    `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policyIds[policyName]}&limit=1`,
  )
  if (attached?.length) {
    log('skip', `  ${policyName} already attached`)
  } else {
    await api('POST', '/access', { role: role.id, policy: policyIds[policyName] })
    log('add', `  attached ${policyName}`)
  }
}

console.log('[6/6] test users')
if (!WITH_TEST_USERS) {
  log('skip', 'no --with-test-users flag; skipping')
} else {
  for (const [email, roleName] of [
    ['editor-test@finco.design', 'Editor'],
    ['publisher-test@finco.design', 'Publisher'],
  ]) {
    if (await findOne('/users', { email })) {
      log('skip', `user ${email} exists`)
    } else {
      const password = randomBytes(12).toString('base64url')
      await api('POST', '/users', { email, password, role: roleIds[roleName] })
      log('add', `created ${email}  password: ${password}  (save this — shown once)`)
    }
  }
}

console.log(`
Done. Next steps:
  1. Run the 10-row permission gate in directus/PHASE1-SETUP.md §5
     (log in as the test users; verify Editor cannot publish/promote/delete).
  2. Snapshot the schema (§6) and commit directus/schema.yaml.
  3. Delete the test users before creating real editor accounts (3-seat limit).
`)
