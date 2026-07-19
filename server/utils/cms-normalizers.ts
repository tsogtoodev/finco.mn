// Normalizers: Directus rows -> the exact flat shapes the components already
// consume from @nuxt/content (camelCase fields, image URL strings, markdown
// bodies parsed to an AST that <ContentRenderer> renders). Keeping these
// shapes identical is what lets the NUXT_CMS_PROVIDER flag flip safely.
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

type DirectusFile = { id: string; filename_disk?: string | null }
type Row = Record<string, any>

const FILE_FIELDS = ['id', 'filename_disk']
const fileSel = (f: string) => FILE_FIELDS.map((sub) => `${f}.${sub}`)

function tr(item: Row, locale: string): Row {
  return item.translations?.find((t: Row) => t.languages_code === locale) ?? {}
}

async function md(body: string | null | undefined) {
  if (!body) return undefined
  const parsed = await parseMarkdown(body)
  return parsed.body
}

const undef = <T>(v: T | null): T | undefined => (v === null ? undefined : v)

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
      'translations.languages_code', 'translations.title', 'translations.department',
      'translations.location', 'translations.employment_type', 'translations.summary',
      'translations.requirements', 'translations.responsibilities', 'translations.application_sections',
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
        requirements: undef(t.requirements),
        responsibilities: undef(t.responsibilities),
        applicationSections: undef(t.application_sections),
      }
    },
  },

  products: {
    param: 'slug',
    sort: 'order',
    fields: [
      'slug', 'audience', 'featured', 'order', ...fileSel('hero_image'), ...fileSel('card_image'),
      'translations.languages_code', 'translations.title', 'translations.menu_title',
      'translations.menu_desc', 'translations.summary', 'translations.category',
      'translations.loan_terms', 'translations.tabs', 'translations.faq', 'translations.body',
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
        loanTerms: undef(t.loan_terms),
        tabs: undef(t.tabs),
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
      'translations.languages_code', 'translations.title', 'translations.breadcrumb',
      'translations.summary', 'translations.cta', 'translations.faq',
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
        cta: undef(t.cta),
        faq: undef(t.faq),
        related: item.related?.map((r: Row) => r.products_id?.slug).filter(Boolean) ?? undefined,
      }
    },
  },

  branches: {
    param: 'slug',
    sort: 'order',
    fields: [
      'slug', 'order', 'pin', 'latitude', 'longitude', ...fileSel('photo'), ...fileSel('map_image'),
      'translations.languages_code', 'translations.name', 'translations.address',
      'translations.phone', 'translations.hours', 'translations.caption',
    ],
    normalize: (item, locale, asset) => {
      const t = tr(item, locale)
      return {
        locale,
        slug: item.slug,
        order: undef(item.order),
        pin: undef(item.pin),
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
    fields: [
      'key',
      'translations.languages_code', 'translations.hero', 'translations.stats',
      'translations.stats_heading', 'translations.value_props', 'translations.hero_slides',
      'translations.beep', 'translations.fincobiz', 'translations.showcases', 'translations.cta',
      'translations.timeline', 'translations.perks', 'translations.leadership', 'translations.team',
      'translations.sections', 'translations.faq', 'translations.about',
    ],
    normalize: (item, locale) => {
      const t = tr(item, locale)
      return {
        locale,
        key: item.key,
        hero: undef(t.hero),
        stats: undef(t.stats),
        statsHeading: undef(t.stats_heading),
        valueProps: undef(t.value_props),
        heroSlides: undef(t.hero_slides),
        beep: undef(t.beep),
        fincobiz: undef(t.fincobiz),
        showcases: undef(t.showcases),
        cta: undef(t.cta),
        timeline: undef(t.timeline),
        perks: undef(t.perks),
        leadership: undef(t.leadership),
        team: undef(t.team),
        sections: undef(t.sections),
        faq: undef(t.faq),
        about: undef(t.about),
      }
    },
  },
}
