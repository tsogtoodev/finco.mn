#!/usr/bin/env node
// Content sanity check — run standalone (`npm run check:content`) and before
// `nuxt build`. Guards the invariants the app relies on:
//   1. Locale parity: every doc exists in BOTH mn/ and en/ (a doc added in one
//      locale only silently 404s / vanishes from lists in the other).
//   2. The `locale:` frontmatter matches the folder it lives in (a mismatch
//      makes the doc invisible to every locale-filtered query).
//   3. The `slug:` matches the filename (detail routes look up by slug).
//   4. Product docs carry `audience` + numeric `order` (menus/grids/carousel
//      filter + sort on them).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')
const LOCALES = ['mn', 'en']
const errors = []

function frontmatter(path) {
  const raw = readFileSync(path, 'utf8')
  if (extname(path) === '.md') {
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!m) return null
    return parseYaml(m[1])
  }
  return parseYaml(raw)
}

for (const collection of readdirSync(CONTENT)) {
  const colDir = join(CONTENT, collection)
  if (!statSync(colDir).isDirectory()) continue

  const byLocale = {}
  for (const locale of LOCALES) {
    let files = []
    try {
      files = readdirSync(join(colDir, locale)).filter((f) => /\.(md|ya?ml)$/.test(f))
    } catch {
      errors.push(`${collection}: missing ${locale}/ folder`)
    }
    byLocale[locale] = new Map(files.map((f) => [f.replace(/\.(md|ya?ml)$/, ''), f]))
  }

  // 1. parity
  for (const [a, b] of [
    ['mn', 'en'],
    ['en', 'mn'],
  ]) {
    for (const name of byLocale[a]?.keys() ?? []) {
      if (!byLocale[b]?.has(name))
        errors.push(`${collection}/${a}/${byLocale[a].get(name)}: no ${b} counterpart`)
    }
  }

  // 2–4. per-file frontmatter checks
  for (const locale of LOCALES) {
    for (const [name, file] of byLocale[locale] ?? []) {
      const path = join(colDir, locale, file)
      let fm
      try {
        fm = frontmatter(path)
      } catch (e) {
        errors.push(`${collection}/${locale}/${file}: unparseable frontmatter (${e.message})`)
        continue
      }
      if (!fm) {
        errors.push(`${collection}/${locale}/${file}: missing frontmatter`)
        continue
      }
      if (fm.locale !== locale)
        errors.push(`${collection}/${locale}/${file}: locale is "${fm.locale}", folder says "${locale}"`)
      if ('slug' in fm && fm.slug !== name)
        errors.push(`${collection}/${locale}/${file}: slug "${fm.slug}" ≠ filename "${name}"`)
      if (collection === 'products') {
        if (!fm.audience) errors.push(`products/${locale}/${file}: missing audience`)
        if (typeof fm.order !== 'number') errors.push(`products/${locale}/${file}: missing numeric order`)
      }
      if (collection === 'news') {
        // Cards/sorting rely on these. The teaser field is `summary`:
        // `excerpt` and `description` are RESERVED page-type fields that
        // @nuxt/content overrides, so a frontmatter string there is lost.
        if (!fm.summary)
          errors.push(
            `news/${locale}/${file}: missing summary${fm.excerpt || fm.description ? ' (found reserved `excerpt`/`description` — rename to summary)' : ''}`,
          )
        if (typeof fm.publishedAt !== 'string')
          errors.push(`news/${locale}/${file}: publishedAt must be a quoted string (got ${typeof fm.publishedAt})`)
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ content check failed (${errors.length}):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('✓ content check passed: locale parity + frontmatter invariants hold')
