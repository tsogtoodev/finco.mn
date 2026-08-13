import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { directusFetch, cmsAssetUrl } from './directus'

type DirectusFile = { id: string; filename_disk?: string | null }
type Row = Record<string, any>

const FILE_FIELDS = ['id', 'filename_disk']
const fileSel = (f: string) => FILE_FIELDS.map((sub) => `${f}.${sub}`)

function tr(item: Row, locale: string): Row {
  return item.translations?.find((t: Row) => t.languages_code === locale) ?? {}
}

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

const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const DELIM_CELL_RE = /^\s*:?-+:?\s*$/
const FENCE_RE = /^\s*(?:```|~~~)/
const MIN_TABLE_ROWS = 2

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
    const separate = () => {
      if (out.length && out[out.length - 1]!.trim() !== '') out.push('')
    }

    if (delimiterFirst) {
      const cols = Math.max(...run.map((r) => tableCells(r).length))
      separate()
      out.push(`|${' |'.repeat(cols)}`)
      out.push(`|${' --- |'.repeat(cols)}`)
      out.push(...run.slice(1))
      i = j
      continue
    }

    if (hasDelimiter) {
      const header = run[0]!
      const headerCells = tableCells(header)
      const delimCells = tableCells(run[1]!).length
      if (headerCells.length !== delimCells) {
        const dataCols = Math.max(delimCells, ...run.slice(2).map((r) => tableCells(r).length))
        separate()
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

const strip = (o: Row): Row | undefined => {
  const out: Row = {}
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== '') out[k] = v
  return Object.keys(out).length ? out : undefined
}
const linkObj = (label: unknown, to: unknown) => strip({ label, to })
const textRows = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => (typeof x === 'string' ? x : x?.text)).filter(Boolean)
  return out.length ? out : undefined
}

const markdownRows = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v || undefined
  return textRows(v)
    ?.map((s, i) => `${i + 1}. ${s}`)
    .join('\n')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
const assembleHeroSlides = (t: Row, url: (v: unknown) => string | undefined) => {
  if (!Array.isArray(t.hero_slides)) return undefined
  return t.hero_slides.map((s: Row) => {
    const raw = s?.image
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
    downloadLabel: t.beep_download_label,
    qr: url(t.beep_qr_file) ?? t.beep_qr,
  })
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
  param: 'slug' | 'key'
  fields: string[]
  sort?: string
  normalize: (item: Row, locale: string, asset: (f: DirectusFile | null) => string | undefined) => Promise<Row> | Row
}

export const CMS_COLLECTIONS: Record<string, CmsCollectionConfig> = {
  news: {
    param: 'slug',
    sort: '-published_at',
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
        requirements: textRows(t.requirements),
        responsibilities: textRows(t.responsibilities),
        applicationSections: undef(t.application_sections),
      }
    },
  },

  products: {
    param: 'slug',
    sort: 'order',
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
    fields: ['key', 'translations.*'],
    normalize: async (item, locale) => {
      const t = tr(item, locale)
      const url = await fileUrlResolver(t)
      return {
        locale,
        key: item.key,
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
        about: assembleAbout(t, url) ?? undef(t.about),
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
