// Normalizers: Directus rows -> the exact flat shapes the components already
// consume from @nuxt/content (camelCase fields, image URL strings, markdown
// bodies parsed to an AST that <ContentRenderer> renders). Keeping these
// shapes identical is what lets the NUXT_CMS_PROVIDER flag flip safely.
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { directusFetch, cmsAssetUrl } from './directus'

type DirectusFile = { id: string; filename_disk?: string | null }
type Row = Record<string, any>

const FILE_FIELDS = ['id', 'filename_disk']
const fileSel = (f: string) => FILE_FIELDS.map((sub) => `${f}.${sub}`)

function tr(item: Row, locale: string): Row {
  return item.translations?.find((t: Row) => t.languages_code === locale) ?? {}
}

// The Directus markdown editor embeds images as <PUBLIC_URL>/assets/<uuid>,
// which the public site can't load (the assets endpoint 403s unauthenticated
// by design — media is served from the R2 hostname instead). Rewrite every
// embedded asset reference to its public media URL before parsing.
const ASSET_REF_RE = /(?:https?:\/\/[^\s)"'`]*)?\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g

async function rewriteAssetRefs(body: string): Promise<string> {
  const ids = [...new Set([...body.matchAll(ASSET_REF_RE)].map((m) => m[1]))]
  if (!ids.length) return body
  const files = await directusFetch<{ id: string; filename_disk?: string }[]>('/files', {
    'filter[id][_in]': ids.join(','),
    fields: 'id,filename_disk',
    limit: ids.length,
  }).catch(() => [] as { id: string; filename_disk?: string }[])
  const byId = new Map(files.map((f) => [f.id, cmsAssetUrl(f)]))
  return body.replace(ASSET_REF_RE, (match, id) => byId.get(id) ?? match)
}

// ── headerless tables ────────────────────────────────────────────────────────
// GFM has no headerless-table syntax: the delimiter row (`| --- | --- |`) is
// what marks a block as a table, and it is only recognised when a header row
// precedes it. So the spec tables editors naturally write —
//
//   | Зээлийн хэмжээ | 5-300 сая |
//   | Зээлийн хугацаа | 1–12 сар |
//
// — parse as a PARAGRAPH and render as literal pipe characters. Nothing
// downstream can recover that; by the time <ContentRenderer> sees the AST there
// is no table to style. So the markdown is normalised here, before the parser:
// a run of pipe rows with no delimiter gets an empty header row and a delimiter
// row injected above it. The empty <thead> that produces is hidden by
// `.prose thead:not(:has(th:not(:empty)))` in app/assets/css/main.css, so it
// renders as the headerless table the editor intended.
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const DELIM_CELL_RE = /^\s*:?-+:?\s*$/
const FENCE_RE = /^\s*(?:```|~~~)/
/** Rows required before a pipe block is treated as a table rather than prose. */
const MIN_TABLE_ROWS = 2

/** Cells of a pipe row. Naive on escaped `\|`, which would inflate the count. */
function tableCells(line: string): string[] {
  return line.trim().slice(1, -1).split('|')
}

function isDelimiterRow(line: string): boolean {
  const cells = tableCells(line)
  return cells.length > 0 && cells.every((c) => DELIM_CELL_RE.test(c))
}

export function normalizeHeaderlessTables(src: string): string {
  if (!src.includes('|')) return src
  const lines = src.split('\n')
  const out: string[] = []
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    // Pipes inside fenced code are content, not table syntax.
    if (FENCE_RE.test(line)) {
      inFence = !inFence
      out.push(line)
      i++
      continue
    }
    if (inFence || !TABLE_ROW_RE.test(line)) {
      out.push(line)
      i++
      continue
    }

    let j = i
    while (j < lines.length && TABLE_ROW_RE.test(lines[j]!)) j++
    const run = lines.slice(i, j)

    const hasDelimiter = run.length >= 2 && isDelimiterRow(run[1]!)
    const delimiterFirst = isDelimiterRow(run[0]!)
    // A table cannot interrupt a paragraph — without a blank line above, an
    // injected header would just extend the preceding text block.
    const separate = () => {
      if (out.length && out[out.length - 1]!.trim() !== '') out.push('')
    }

    if (delimiterFirst) {
      // Delimiter with no header above it — the CMS "insert table" control emits
      // this. The injected header AND the delimiter both have to be sized to the
      // widest row: keeping the authored delimiter's own width would leave it
      // mismatched against the header (GFM then silently refuses the table), and
      // sizing everything down to it would truncate the cells of any wider row.
      const cols = Math.max(...run.map((r) => tableCells(r).length))
      separate()
      out.push(`|${' |'.repeat(cols)}`)
      out.push(`|${' --- |'.repeat(cols)}`)
      out.push(...run.slice(1)) // the original delimiter is replaced, not kept
      i = j
      continue
    }

    if (hasDelimiter) {
      // GFM also requires the delimiter row to have EXACTLY as many cells as the
      // header. The CMS's "insert table" control emits mismatched counts (a
      // 6-cell empty header over a 4-cell delimiter on secured-loan), which
      // silently fails to parse the same way a missing delimiter does.
      const header = run[0]!
      const headerCells = tableCells(header)
      const delimCells = tableCells(run[1]!).length
      if (headerCells.length !== delimCells) {
        const dataCols = Math.max(delimCells, ...run.slice(2).map((r) => tableCells(r).length))
        separate()
        // An all-empty header is the editor artifact, not authored content — it
        // can be resized freely. A header with real text is left intact and only
        // the delimiter is brought into line, so no copy is ever dropped.
        const headerIsEmpty = headerCells.every((c) => c.trim() === '')
        const cols = headerIsEmpty ? dataCols : headerCells.length
        out.push(headerIsEmpty ? `|${' |'.repeat(cols)}` : header)
        out.push(`|${' --- |'.repeat(cols)}`)
        out.push(...run.slice(2))
        i = j
        continue
      }
    }
    else if (run.length >= MIN_TABLE_ROWS) {
      // Widest row wins: GFM truncates any row longer than the header, so
      // sizing to the max is what keeps every cell the editor typed.
      const cols = Math.max(...run.map((r) => tableCells(r).length))
      separate()
      out.push(`|${' |'.repeat(cols)}`)
      out.push(`|${' --- |'.repeat(cols)}`)
    }
    out.push(...run)
    i = j
  }

  return out.join('\n')
}

// Markdown that stays a STRING: the editor-facing fixups (asset refs, headerless
// tables) without the parse, for fields the components hand to <MDC> and parse at
// render time (the product detail tabs).
async function mdText(src: string | null | undefined) {
  if (!src) return undefined
  return normalizeHeaderlessTables(await rewriteAssetRefs(src))
}

async function md(body: string | null | undefined) {
  const src = await mdText(body)
  if (!src) return undefined
  const parsed = await parseMarkdown(src)
  return parsed.body
}

const undef = <T>(v: T | null): T | undefined => (v === null ? undefined : v)

// ── flattened-JSON helpers ───────────────────────────────────────────────────
// Editors work with flat fields / repeaters (directus/setup-flatten-json.mjs);
// these reassemble the nested shapes components consume. Every assembler
// returns undefined when the flat fields are empty so callers can fall back to
// the legacy JSON column until it is dropped.
const strip = (o: Row): Row | undefined => {
  const out: Row = {}
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== '') out[k] = v
  return Object.keys(out).length ? out : undefined
}
const linkObj = (label: unknown, to: unknown) => strip({ label, to })
// repeater rows [{text}] -> string[] (tolerates pre-migration plain strings)
const textRows = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => (typeof x === 'string' ? x : x?.text)).filter(Boolean)
  return out.length ? out : undefined
}

// Markdown, tolerating the repeater rows a field held before it became rich
// text: [{text}] rows fold into an ordered list, a string passes through.
const markdownRows = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v || undefined
  return textRows(v)
    ?.map((s, i) => `${i + 1}. ${s}`)
    .join('\n')
}

// Editor-managed images on pages are relational file uuids
// (directus/setup-image-fields.mjs); the translations.* wildcard returns them
// as bare uuid strings, so resolve id -> media URL in one batched /files
// lookup. Legacy /images/… path strings pass through as a fallback.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Hero-slide background columns, one per fixed slide key
// (directus/setup-hero-slide-relational-images.mjs).
const HERO_SLIDE_FILE_FIELDS: Record<string, string> = {
  fincoBiz: 'hero_slide_fincobiz_file',
  beepWallet: 'hero_slide_beepwallet_file',
  loans: 'hero_slide_loans_file',
  trust: 'hero_slide_trust_file',
}

async function fileUrlResolver(t: Row): Promise<(v: unknown) => string | undefined> {
  const ids = [
    t.hero_image_file,
    t.about_hero_photo_file,
    t.about_ceo_portrait_file,
    t.beep_qr_file,
    ...Object.values(HERO_SLIDE_FILE_FIELDS).map((f) => t[f]),
    ...(Array.isArray(t.about_board_members) ? t.about_board_members.map((m: Row) => m?.photo) : []),
    ...(Array.isArray(t.hero_slides) ? t.hero_slides.map((s: Row) => s?.image) : []),
  ].filter((v): v is string => typeof v === 'string' && UUID_RE.test(v))
  if (!ids.length) return () => undefined
  const files = await directusFetch<DirectusFile[]>('/files', {
    'filter[id][_in]': [...new Set(ids)].join(','),
    fields: 'id,filename_disk',
    limit: ids.length,
  }).catch(() => [] as DirectusFile[])
  const byId = new Map(files.map((f) => [f.id, cmsAssetUrl(f)]))
  return (v: unknown) => (typeof v === 'string' ? byId.get(v) : undefined)
}

const assembleHero = (t: Row, url: (v: unknown) => string | undefined) =>
  strip({
    eyebrow: t.hero_eyebrow,
    headline: t.hero_headline,
    accent: t.hero_accent,
    subheadline: t.hero_subheadline,
    image: url(t.hero_image_file) ?? t.hero_image,
    cta: linkObj(t.hero_cta_label, t.hero_cta_to),
    secondaryCta: linkObj(t.hero_secondary_cta_label, t.hero_secondary_cta_to),
  })
// Home hero carousel rows. Copy passes through as-is. The background image
// prefers the slide's RELATIONAL column (hero_slide_*_file — the real file
// fields with a working Studio picker), then the legacy repeater uuid, then a
// legacy path string. Rows with no image keep the component's baked art.
const assembleHeroSlides = (t: Row, url: (v: unknown) => string | undefined) => {
  if (!Array.isArray(t.hero_slides)) return undefined
  return t.hero_slides.map((s: Row) => {
    const raw = s?.image
    // A uuid that didn't resolve (file deleted) must NOT reach the <img> as a
    // src, so drop it and let the component fall back.
    const legacy = typeof raw === 'string' && UUID_RE.test(raw) ? url(raw) : raw || undefined
    const image = url(t[HERO_SLIDE_FILE_FIELDS[s?.key as string] ?? '']) ?? legacy
    const { image: _, ...rest } = s ?? {}
    return image ? { ...rest, image } : rest
  })
}
const assembleValueProps = (t: Row) =>
  strip({
    heading: t.value_props_heading,
    accent: t.value_props_accent,
    subheading: t.value_props_subheading,
    items: t.value_props_items ?? undefined,
  })
const assembleBeep = (t: Row, url: (v: unknown) => string | undefined) =>
  strip({
    heading: t.beep_heading,
    subtext: t.beep_subtext,
    expandLead: t.beep_expand_lead,
    expandRest: t.beep_expand_rest,
    teaser: t.beep_teaser,
    // Store-badge label + the scannable download QR
    // (directus/setup-beep-download.mjs).
    downloadLabel: t.beep_download_label,
    qr: url(t.beep_qr_file) ?? t.beep_qr,
  })
// Each FincoBiz card carries its own tab label, heading and body. Previously
// only the tab existed (`fincobiz_card_<id>`, a bare string) and the deck's
// headings/bodies came from i18n — except the `request` card, which borrowed the
// section-level callout fields. The per-card `_heading`/`_body` fields are added
// by directus/setup-fincobiz-cards.mjs; until that has run they are simply
// absent from the `translations.*` wildcard and the card falls back as before.
const FINCOBIZ_CARDS = ['request', 'receivables', 'eligibility'] as const

const assembleFincobizCards = (t: Row) =>
  strip(
    Object.fromEntries(
      FINCOBIZ_CARDS.map((id) => [
        id,
        strip({
          tab: t[`fincobiz_card_${id}`],
          heading: t[`fincobiz_card_${id}_heading`],
          body: t[`fincobiz_card_${id}_body`],
        }),
      ]),
    ),
  )

const assembleFincobiz = (t: Row) =>
  strip({
    subtext: t.fincobiz_subtext,
    calloutHeading: t.fincobiz_callout_heading,
    calloutSubtext: t.fincobiz_callout_subtext,
    cards: assembleFincobizCards(t),
  })

// The About page's structure lives as flat about_* fields in Directus (editor
// UX: real inputs/repeaters instead of one giant JSON blob — see
// directus/setup-about-restructure.mjs, whose explode() mirrors this exactly).
// Reassemble the nested `about` object components consume. Undefined until the
// restructure migration has run (the caller falls back to the legacy blob).
function assembleAbout(t: Row, url: (v: unknown) => string | undefined): Row | undefined {
  if (!t.about_hero_headline) return undefined
  return {
    hero: { headline: t.about_hero_headline, intro: t.about_hero_intro, photo: url(t.about_hero_photo_file) ?? t.about_hero_photo },
    mission: { blocks: t.about_mission_blocks ?? [] },
    values: {
      headingLead: t.about_values_heading_lead,
      headingAccent: t.about_values_heading_accent,
      subheading: t.about_values_subheading,
      items: t.about_values_items ?? [],
    },
    history: {
      headingLead: t.about_history_heading_lead,
      headingAccent: t.about_history_heading_accent,
      subheading: t.about_history_subheading,
      milestones: t.about_history_milestones ?? [],
    },
    ceo: {
      headingLead: t.about_ceo_heading_lead,
      headingAccent: t.about_ceo_heading_accent,
      subheading: t.about_ceo_subheading,
      greetingTitle: t.about_ceo_greeting_title,
      // textarea -> paragraphs (blank-line separated)
      greetingBody: String(t.about_ceo_greeting_body ?? '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
      tagline: t.about_ceo_tagline,
      signatureLabel: t.about_ceo_signature_label,
      signatureName: t.about_ceo_signature_name,
      portrait: url(t.about_ceo_portrait_file) ?? t.about_ceo_portrait,
    },
    board: {
      headingLead: t.about_board_heading_lead,
      headingAccent: t.about_board_heading_accent,
      members: (t.about_board_members ?? []).map((m: Row) => ({ ...m, photo: url(m?.photo) ?? m?.photo })),
    },
    org: {
      headingLead: t.about_org_heading_lead,
      headingAccent: t.about_org_heading_accent,
      subheading: t.about_org_subheading,
      root: t.about_org_root,
      ceo: t.about_org_ceo,
      departments: t.about_org_departments ?? [],
    },
  }
}

export interface CmsCollectionConfig {
  /** query param that selects a single record */
  param: 'slug' | 'key'
  /** Directus field selection */
  fields: string[]
  /** Directus sort */
  sort?: string
  normalize: (item: Row, locale: string, asset: (f: DirectusFile | null) => string | undefined) => Promise<Row> | Row
}

export const CMS_COLLECTIONS: Record<string, CmsCollectionConfig> = {
  news: {
    param: 'slug',
    sort: '-published_at',
    // `*` for the base columns, not a list: naming `featured` while the column
    // is still absent 403s the WHOLE query ("...or it does not exist"), which
    // would take the news index and every article down in the window between
    // deploying this and running directus/setup-news-featured.mjs. The wildcard
    // reads it once it exists and shrugs until then — same trick the pages
    // normalizer uses for `translations.*`. The explicit image sub-fields still
    // win over the wildcard's bare uuid, so `asset()` gets its file object.
    fields: [
      '*', ...fileSel('image'),
      'translations.languages_code', 'translations.title', 'translations.summary', 'translations.body',
    ],
    normalize: async (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        publishedAt: item.published_at,
        featured: undef(item.featured),
        to: undef(item.external_url),
        image: asset(item.image),
        title: t.title,
        summary: undef(t.summary),
        body: await md(t.body),
      }
    },
  },

  jobs: {
    param: 'slug',
    sort: '-posted_at',
    fields: [
      'slug', 'posted_at',
      'translations.*',
    ],
    normalize: (item, locale) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        postedAt: undef(item.posted_at),
        title: t.title,
        department: undef(t.department),
        location: undef(t.location),
        type: undef(t.employment_type),
        summary: undef(t.summary),
        // repeater rows [{text}] -> string[] (textRows also passes through
        // pre-migration plain-string arrays)
        requirements: textRows(t.requirements),
        responsibilities: textRows(t.responsibilities),
        applicationSections: undef(t.application_sections),
      }
    },
  },

  products: {
    param: 'slug',
    sort: 'order',
    // translations.* wildcard: the flattened loan_*/tabs_* fields land with the
    // migration and the legacy loan_terms/tabs columns leave with
    // --drop-legacy; naming either while absent would 403 the whole query.
    fields: [
      'slug', 'audience', 'featured', 'order', ...fileSel('hero_image'), ...fileSel('card_image'),
      'translations.*',
      'related.related_products_id.slug',
    ],
    normalize: async (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        audience: item.audience,
        featured: undef(item.featured),
        order: undef(item.order),
        heroImage: asset(item.hero_image),
        cardImage: asset(item.card_image),
        title: t.title,
        menuTitle: undef(t.menu_title),
        menuDesc: undef(t.menu_desc),
        summary: undef(t.summary),
        category: undef(t.category),
        loanTerms: strip({ amount: t.loan_amount, rate: t.loan_rate, period: t.loan_period }) ?? undef(t.loan_terms),
        // Both tab bodies are markdown (rich-text editor, directus/setup-tabs-richtext.mjs).
        // A pre-migration repeater value is folded into an ordered list so the
        // rendered result is identical to the numbered rows it used to produce.
        tabs:
          strip({
            requirements: await mdText(markdownRows(t.tabs_requirements)),
            other: await mdText(t.tabs_other),
          }) ?? undef(t.tabs),
        faq: undef(t.faq),
        body: await md(t.body),
        related: item.related?.map((r: Row) => r.related_products_id?.slug).filter(Boolean) ?? undefined,
      }
    },
  },

  services: {
    param: 'slug',
    sort: 'order',
    fields: [
      'slug', 'order', ...fileSel('hero_image'),
      'translations.*',
      'related.products_id.slug',
    ],
    normalize: (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        order: undef(item.order),
        heroImage: asset(item.hero_image),
        title: t.title,
        breadcrumb: undef(t.breadcrumb),
        summary: undef(t.summary),
        cta: linkObj(t.cta_label, t.cta_to) ?? undef(t.cta),
        faq: undef(t.faq),
        related: item.related?.map((r: Row) => r.products_id?.slug).filter(Boolean) ?? undefined,
      }
    },
  },

  branches: {
    param: 'slug',
    sort: 'order',
    // base * wildcard: pin_x/pin_y arrive with the migration, pin leaves with
    // --drop-legacy; explicit file sub-selections still apply on top of it.
    fields: [
      '*', ...fileSel('photo'), ...fileSel('map_image'),
      'translations.*',
    ],
    normalize: (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        order: undef(item.order),
        pin: item.pin_x != null && item.pin_y != null ? { x: item.pin_x, y: item.pin_y } : undef(item.pin),
        coords: { lat: item.latitude, lng: item.longitude },
        photo: asset(item.photo),
        mapImage: asset(item.map_image),
        name: t.name,
        address: t.address,
        phone: undef(t.phone),
        hours: undef(t.hours),
        caption: undef(t.caption),
      }
    },
  },

  legal: {
    param: 'slug',
    fields: [
      'slug', 'updated_at',
      'translations.languages_code', 'translations.title', 'translations.summary', 'translations.body',
    ],
    normalize: async (item, locale) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        updatedAt: undef(item.updated_at),
        title: t.title,
        summary: undef(t.summary),
        body: await md(t.body),
      }
    },
  },

  pages: {
    param: 'key',
    // Wildcard on purpose: the about_* fields land with the restructure
    // migration and the legacy `about` blob leaves with --drop-blob. Naming
    // either one while it doesn't exist would 403 the whole query; `*` always
    // returns whatever currently exists (pages is 6 records — overfetch is
    // negligible).
    fields: ['key', 'translations.*'],
    normalize: async (item, locale) => {
      const t = tr(item, locale)
      const url = await fileUrlResolver(t)
      return {
        locale,
        key: item.key,
        // flattened fields win; legacy JSON columns until --drop-legacy
        hero: assembleHero(t, url) ?? undef(t.hero),
        stats: undef(t.stats),
        statsHeading: undef(t.stats_heading),
        valueProps: assembleValueProps(t) ?? undef(t.value_props),
        heroSlides: assembleHeroSlides(t, url) ?? undef(t.hero_slides),
        beep: assembleBeep(t, url) ?? undef(t.beep),
        fincobiz: assembleFincobiz(t) ?? undef(t.fincobiz),
        showcases: undef(t.showcases),
        cta: undef(t.cta),
        timeline: undef(t.timeline),
        perks: undef(t.perks),
        leadership: undef(t.leadership),
        team: undef(t.team),
        sections: undef(t.sections),
        faq: undef(t.faq),
        // Structured fields win; legacy blob until the migration has run.
        about: assembleAbout(t, url) ?? undef(t.about),
      }
    },
  },

  // Flat key/value site settings (directus/setup-configuration.mjs). The only
  // collection with no translations table: a phone number and a Facebook URL
  // are the same string in every locale, so `locale` is accepted and ignored
  // rather than used to pick a row. The shape matches the @nuxt/content
  // fallback in content/configuration/*.yml one field for one field.
  announcement: {
    param: 'key',
    // One record ('bar'), translated. `translations.*` for the same reason the
    // pages normalizer uses it: naming a column that has not landed yet 403s
    // the whole query, and this one renders on every route.
    fields: ['key', 'enabled', 'cta_url', 'translations.*'],
    normalize: (item, locale) => {
      const t = tr(item, locale)
      return {
        locale,
        key: item.key,
        // Absent column (pre-migration) reads as enabled — the bar's copy is
        // what decides whether it says anything, and a silently hidden strip is
        // harder to diagnose than a visible one.
        enabled: item.enabled !== false,
        text: t.text ?? '',
        ctaLabel: undef(t.cta_label),
        ctaUrl: undef(item.cta_url),
      }
    },
  },

  configuration: {
    param: 'key',
    sort: 'sort',
    fields: ['key', 'value'],
    normalize: (item) => ({
      key: item.key,
      value: item.value ?? '',
    }),
  },
}
