#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

const B = (process.env.DIRECTUS_URL ?? 'https://cms.finco.design').replace(/\/$/, '')
const ADMIN = process.env.DIRECTUS_TOKEN
const APP = (process.env.APP ?? 'http://localhost:3000').replace(/\/$/, '')

const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

async function api(token, method, path, body) {
  const res = await fetch(B + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, data: json.data, errors: json.errors }
}
const admin = (m, p, b) => api(ADMIN, m, p, b)

async function loginAs(email) {
  const password = randomBytes(12).toString('base64url')
  const users = (await admin('GET', `/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id`)).data
  if (!users?.length) throw new Error(`missing test user ${email} — create via setup-phase1.mjs --with-test-users`)
  await admin('PATCH', `/users/${users[0].id}`, { password })
  const login = await api('', 'POST', '/auth/login', { email, password })
  if (!login.data?.access_token) throw new Error(`login failed for ${email}`)
  return login.data.access_token
}

const editor = await loginAs('editor-test@finco.design')
const publisher = await loginAs('publisher-test@finco.design')

const target = (await admin('GET', '/items/news?filter[slug][_eq]=beep-update&fields=id,external_url,status')).data[0]
if (target.status !== 'published') throw new Error('beep-update must be published for this UAT')

let draftId = null
let versionId = null
try {
  const c1 = await api(editor, 'POST', '/items/news', {
    slug: 'uat-editor-draft',
    published_at: '2026-07-20T00:00:00',
    translations: [
      { languages_code: 'mn', title: 'UAT туршилт', summary: 'UAT', body: 'UAT body' },
      { languages_code: 'en', title: 'UAT test', summary: 'UAT', body: 'UAT body' },
    ],
  })
  draftId = c1.data?.id ?? null
  const created = draftId ? (await admin('GET', `/items/news/${draftId}?fields=status`)).data : null
  check('Editor creates draft (status auto-draft)', c1.status === 200 && created?.status === 'draft', `status=${c1.status}, item=${created?.status}`)

  const c2 = await api(editor, 'PATCH', `/items/news/${draftId}`, { status: 'published' })
  const after2 = (await admin('GET', `/items/news/${draftId}?fields=status`)).data
  check('Editor denied publishing (status write)', c2.status === 403 && after2.status === 'draft', `status=${c2.status}`)

  const c3 = await api(editor, 'PATCH', `/items/news/${draftId}`, { external_url: 'https://example.com/uat' })
  check('Editor edits own draft', c3.status === 200, `status=${c3.status}`)

  const c4 = await api(editor, 'PATCH', `/items/news/${target.id}`, { external_url: 'https://hacked.example' })
  check('Editor denied editing published item', c4.status === 403, `status=${c4.status}`)

  const c5 = await api(editor, 'POST', '/versions', { key: 'uat-edit', name: 'UAT edit', collection: 'news', item: String(target.id) })
  versionId = c5.data?.id ?? null
  const c5b = versionId ? await api(editor, 'POST', `/versions/${versionId}/save`, { external_url: 'https://uat.finco.design/promoted' }) : { status: 0 }
  const mainUntouched = (await admin('GET', `/items/news/${target.id}?fields=external_url`)).data.external_url === target.external_url
  check('Editor creates + saves content version', c5.status === 200 && c5b.status === 200, `create=${c5.status}, save=${c5b.status}`)
  check('Main record unchanged by version save', mainUntouched)

  try {
    const SECRET = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/NUXT_CMS_PREVIEW_SECRET=(\S+)/)[1]
    const boot = await fetch(`${APP}/api/cms/preview?secret=${SECRET}&collection=news&id=${target.id}&locale=mn&version=uat-edit`, { redirect: 'manual' })
    const cookie = (boot.headers.get('set-cookie') ?? '').split(';')[0]
    const prev = await fetch(`${APP}/api/cms/news?locale=mn&slug=beep-update`, { headers: { cookie } }).then((r) => r.json())
    check('Version preview shows unpromoted change', prev?.to === 'https://uat.finco.design/promoted', `to=${prev?.to}`)
  } catch (e) {
    check('Version preview shows unpromoted change', false, `app unreachable: ${e.message}`)
  }

  const vHash = (await admin('GET', `/versions/${versionId}?fields=hash`)).data.hash
  const c7 = await api(editor, 'POST', `/versions/${versionId}/promote`, { mainHash: vHash })
  check('Editor denied promote', c7.status === 403, `status=${c7.status}`)

  const c8 = await api(publisher, 'POST', `/versions/${versionId}/promote`, { mainHash: vHash })
  const promoted = (await admin('GET', `/items/news/${target.id}?fields=external_url`)).data.external_url
  check('Publisher promotes version to main', c8.status === 200 && promoted === 'https://uat.finco.design/promoted', `status=${c8.status}, url=${promoted}`)

  const c9 = await api(editor, 'DELETE', `/items/news/${draftId}`)
  check('Editor denied delete', c9.status === 403, `status=${c9.status}`)

  const c10 = await api(publisher, 'PATCH', `/items/news/${draftId}`, { status: 'archived' })
  const c10b = await api(publisher, 'DELETE', `/items/news/${draftId}`)
  check('Publisher archives; hard delete denied', c10.status === 200 && c10b.status === 403, `archive=${c10.status}, delete=${c10b.status}`)
} finally {
  if (versionId) await admin('DELETE', `/versions/${versionId}`)
  await admin('PATCH', `/items/news/${target.id}`, { external_url: target.external_url ?? null })
  if (draftId) await admin('DELETE', `/items/news/${draftId}`)
}

console.log(results.join('\n'))
const failed = results.some((r) => r.startsWith('FAIL'))
console.log(failed ? '\nUAT FAILED — do not proceed to cutover (plan §6: fix policy, never weaken the boundary)' : '\nROLE UAT PASSED')
process.exit(failed ? 1 : 0)
