import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { asSitemapCollection } from '@nuxtjs/sitemap/content'

// Reusable building blocks for landing-page content.
// Extend these as the Figma design system defines concrete section types.
const link = z.object({
  label: z.string(),
  to: z.string(),
})

const hero = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  cta: link.optional(),
  secondaryCta: link.optional(),
  image: z.string().optional(),
})

const feature = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
})

// One `page` collection covering both locales — the locale is encoded in the
// path prefix (/mn/**, /en/**), matching the route. Split into per-type
// collections once Figma fixes the page taxonomy.
const pageSchema = z.object({
  // SEO
  title: z.string(),
  description: z.string().optional(),
  ogImage: z.string().optional(),
  // Navigation
  navigation: z
    .object({ title: z.string().optional() })
    .or(z.boolean())
    .optional(),
  // Landing content (all optional so plain markdown pages still validate)
  hero: hero.optional(),
  features: z.array(feature).optional(),
})

export default defineContentConfig({
  collections: {
    content: defineCollection(
      asSitemapCollection({
        type: 'page',
        source: '**',
        schema: pageSchema,
      }),
    ),
  },
})
