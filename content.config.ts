import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// ─── Shared fragments ────────────────────────────────────────────────────────
// Locale lives as a frontmatter field (not a path prefix) so each catalog type
// is a single collection queried with `.where('locale', '=', locale.value)`.
// Slugs are shared across locales; only title/body fields are translated.
const locale = z.enum(['mn', 'en'])

const link = z.object({
  label: z.string(),
  to: z.string(),
})

const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
})

// ─── Products (individual + business loan products) ──────────────────────────
const products = defineCollection({
  type: 'data',
  source: 'products/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    audience: z.enum(['individual', 'business']),
    title: z.string(),
    summary: z.string().optional(),
    category: z.string().optional(), // e.g. "Ногоон зээл" → Chip
    heroImage: z.string().optional(),
    order: z.number().optional(),
    loanTerms: z
      .object({
        amount: z.string(), // display strings, already localised
        rate: z.string(),
        period: z.string(),
      })
      .optional(),
    tabs: z
      .object({
        info: z.string().optional(),
        requirements: z.array(z.string()).optional(),
        other: z.string().optional(),
      })
      .optional(),
    related: z.array(z.string()).optional(), // product slugs
    faq: z.array(faqItem).optional(),
  }),
})

// ─── Trust services ──────────────────────────────────────────────────────────
const services = defineCollection({
  type: 'data',
  source: 'services/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    heroImage: z.string().optional(),
    order: z.number().optional(),
    related: z.array(z.string()).optional(),
    faq: z.array(faqItem).optional(),
  }),
})

// ─── Branch locations ────────────────────────────────────────────────────────
const branches = defineCollection({
  type: 'data',
  source: 'branches/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    name: z.string(),
    address: z.string(),
    phone: z.string().optional(),
    hours: z.string().optional(),
    photo: z.string().optional(),
    coords: z.object({ lat: z.number(), lng: z.number() }), // → static MapEmbed
    order: z.number().optional(),
  }),
})

// ─── Careers / open positions ────────────────────────────────────────────────
const jobs = defineCollection({
  type: 'data',
  source: 'jobs/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.string().optional(), // full-time, etc.
    postedAt: z.string().optional(),
    summary: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    // Multi-step application form, data-driven so it stays bilingual without code.
    applicationSections: z
      .array(
        z.object({
          id: z.string(), // 'general' | 'experience' | 'other' | 'attachments'
          title: z.string(),
          fields: z.array(
            z.object({
              name: z.string(),
              label: z.string(),
              type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'file', 'date']),
              required: z.boolean().optional(),
              options: z.array(z.string()).optional(),
            }),
          ),
        }),
      )
      .optional(),
  }),
})

// ─── News / blog cards ───────────────────────────────────────────────────────
const news = defineCollection({
  type: 'data',
  source: 'news/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    publishedAt: z.string(),
    to: z.string().optional(),
  }),
})

// ─── Structured copy for the static pages (home/about/…) ─────────────────────
const pages = defineCollection({
  type: 'data',
  source: 'pages/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    key: z.enum(['home', 'about', 'products', 'business', 'branches', 'careers']),
    hero: z
      .object({
        eyebrow: z.string().optional(),
        headline: z.string(),
        subheadline: z.string().optional(),
        cta: link.optional(),
        secondaryCta: link.optional(),
        image: z.string().optional(),
      })
      .optional(),
    stats: z
      .array(z.object({ value: z.number(), suffix: z.string().optional(), label: z.string() }))
      .optional(),
    statsHeading: z.string().optional(),
    // Bento value-prop block (home). `accent` renders in the blurple accent.
    valueProps: z
      .object({
        heading: z.string(),
        accent: z.string().optional(),
        subheading: z.string().optional(),
        items: z.array(
          z.object({ title: z.string(), body: z.string(), icon: z.string().optional() }),
        ),
      })
      .optional(),
    // Dark/light product showcase panels (Beep, FincoBiz).
    showcases: z
      .array(
        z.object({
          theme: z.enum(['dark', 'light']).default('light'),
          eyebrow: z.string().optional(),
          title: z.string(),
          body: z.string().optional(),
          image: z.string().optional(),
          cta: link.optional(),
        }),
      )
      .optional(),
    // Closing CTA banner.
    cta: z
      .object({ heading: z.string(), body: z.string().optional(), button: link.optional() })
      .optional(),
    timeline: z
      .array(z.object({ year: z.string(), title: z.string(), body: z.string().optional() }))
      .optional(),
    perks: z
      .array(z.object({ title: z.string(), body: z.string().optional(), icon: z.string().optional() }))
      .optional(),
    leadership: z
      .object({
        name: z.string(),
        role: z.string(),
        quote: z.string().optional(),
        photo: z.string().optional(),
      })
      .optional(),
    team: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
          bio: z.string().optional(),
          avatar: z.string().optional(),
        }),
      )
      .optional(),
    sections: z
      .array(z.object({ id: z.string(), heading: z.string().optional(), body: z.string().optional() }))
      .optional(),
    faq: z.array(faqItem).optional(),
  }),
})

export default defineContentConfig({
  collections: { products, services, branches, jobs, news, pages },
})
