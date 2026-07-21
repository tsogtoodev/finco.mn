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

async function md(body: string | null | undefined) {
  if (!body) return undefined
  const parsed = await parseMarkdown(await rewriteAssetRefs(body))
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

// Editor-managed images on pages are relational file uuids
// (directus/setup-image-fields.mjs); the translations.* wildcard returns them
// as bare uuid strings, so resolve id -> media URL in one batched /files
// lookup. Legacy /images/… path strings pass through as a fallback.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function fileUrlResolver(t: Row): Promise<(v: unknown) => string | undefined> {
  const ids = [
    t.hero_image_file,
    t.about_hero_photo_file,
    t.about_ceo_portrait_file,
    ...(Array.isArray(t.about_board_members) ? t.about_board_members.map((m: Row) => m?.photo) : []),
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
const assembleValueProps = (t: Row) =>
  strip({
    heading: t.value_props_heading,
    accent: t.value_props_accent,
    subheading: t.value_props_subheading,
    items: t.value_props_items ?? undefined,
  })
const assembleBeep = (t: Row) =>
  strip({ heading: t.beep_heading, subtext: t.beep_subtext, expandLead: t.beep_expand_lead, expandRest: t.beep_expand_rest, teaser: t.beep_teaser })
const assembleFincobiz = (t: Row) =>
  strip({
    subtext: t.fincobiz_subtext,
    calloutHeading: t.fincobiz_callout_heading,
    calloutSubtext: t.fincobiz_callout_subtext,
    cards: strip({ request: t.fincobiz_card_request, receivables: t.fincobiz_card_receivables, eligibility: t.fincobiz_card_eligibility }),
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
    fields: [
      'slug', 'published_at', 'external_url', ...fileSel('image'),
      'translations.languages_code', 'translations.title', 'translations.summary', 'translations.body',
    ],
    normalize: async (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        publishedAt: item.published_at,
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
        tabs: strip({ requirements: textRows(t.tabs_requirements), other: t.tabs_other }) ?? undef(t.tabs),
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
        heroSlides: undef(t.hero_slides),
        beep: assembleBeep(t) ?? undef(t.beep),
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
}
