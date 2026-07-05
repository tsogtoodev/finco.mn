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
    // Mega-menu overrides: menuTitle allows decorations (e.g. the 🍀 prefix)
    // without polluting the page title; menuDesc is the one-liner under the
    // menu link (falls back to summary).
    menuTitle: z.string().optional(),
    menuDesc: z.string().optional(),
    summary: z.string().optional(),
    category: z.string().optional(), // e.g. "Ногоон зээл" → Chip
    heroImage: z.string().optional(),
    cardImage: z.string().optional(), // home-carousel card art (≠ heroImage)
    featured: z.boolean().optional(), // shown in the home products carousel
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
    breadcrumb: z.string().optional(), // short label for the breadcrumb (≠ headline)
    summary: z.string().optional(),
    heroImage: z.string().optional(),
    cta: link.optional(), // hero CTA pill → label + localized route
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
    caption: z.string().optional(), // overlay label on the branch photo
    mapImage: z.string().optional(), // static tilted map base (animated pin layered on top)
    pin: z.object({ x: z.number(), y: z.number() }).optional(), // normalised pin position (0–1)
    coords: z.object({ lat: z.number(), lng: z.number() }), // → "open in Google Maps"
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

// ─── News / blog articles ─────────────────────────────────────────────────────
// `page` type so each article has a markdown body rendered at /news/[slug].
// `to` remains as an optional external/override link for cards. NB: the card
// teaser is `summary`, NOT `excerpt` — `excerpt` is a RESERVED page-type field
// (@nuxt/content's rendered body excerpt) and silently nulls a frontmatter
// string of the same name.
const news = defineCollection({
  type: 'page',
  source: 'news/**/*.md',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    image: z.string().optional(),
    publishedAt: z.string(),
    to: z.string().optional(),
  }),
})

// ─── Legal / policy pages (terms, privacy) ──────────────────────────────────
// `page` type so each doc has a markdown body rendered at /legal/[slug]. Slug
// shared across locales; only title/summary/body are translated.
const legal = defineCollection({
  type: 'page',
  source: 'legal/**/*.md',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    updatedAt: z.string().optional(), // last-revised date, shown under the title
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
        accent: z.string().optional(), // substring of headline rendered in the accent colour
        subheadline: z.string().optional(),
        cta: link.optional(),
        secondaryCta: link.optional(),
        image: z.string().optional(),
      })
      .optional(),
    stats: z
      .array(
        z.object({
          value: z.number(),
          prefix: z.string().optional(),
          suffix: z.string().optional(),
          label: z.string(),
        }),
      )
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
    // Home hero carousel copy, keyed to the component's slide configs
    // (fincoBiz / beepWallet / loans / trust). Art, routes and timing stay
    // component-side; editors manage the words.
    heroSlides: z
      .array(
        z.object({
          key: z.string(),
          tab: z.string(),
          headline: z.string(),
          subtext: z.string(),
        }),
      )
      .optional(),
    // Beep showcase copy (home). Pills/artwork are baked images.
    beep: z
      .object({
        heading: z.string(),
        subtext: z.string(),
        expandLead: z.string(),
        expandRest: z.string(),
      })
      .optional(),
    // FincoBiz showcase copy (home) incl. the interactive card-deck tab titles.
    fincobiz: z
      .object({
        subtext: z.string(),
        calloutHeading: z.string(),
        calloutSubtext: z.string(),
        cards: z.object({
          request: z.string(),
          receivables: z.string(),
          eligibility: z.string(),
        }),
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
    // About page structure (mirrors the former app/data/about.ts shape); only
    // present on the `about` docs.
    about: z
      .object({
        hero: z.object({ headline: z.string(), intro: z.string(), photo: z.string() }),
        mission: z.object({
          blocks: z.array(z.object({ badge: z.string(), heading: z.string(), body: z.string() })),
        }),
        values: z.object({
          heading: z.string(),
          subheading: z.string(),
          items: z.array(
            z.object({
              title: z.string(),
              body: z.string(),
              align: z.enum(['left', 'center', 'right']),
            }),
          ),
        }),
        history: z.object({
          heading: z.string(),
          subheading: z.string(),
          milestones: z.array(z.object({ year: z.string(), body: z.string() })),
        }),
        ceo: z.object({
          headingLead: z.string(),
          headingAccent: z.string(),
          subheading: z.string(),
          greetingTitle: z.string(),
          greetingBody: z.array(z.string()),
          tagline: z.string(),
          signatureLabel: z.string(),
          signatureName: z.string(),
          portrait: z.string(),
        }),
        board: z.object({
          headingLead: z.string(),
          headingAccent: z.string(),
          members: z.array(
            z.object({
              name: z.string(),
              role: z.string(),
              bio: z.string(),
              // Optional career timeline shown on hover, cross-fading over `bio`.
              // Newlines are preserved (rendered with whitespace-pre-line).
              bioHover: z.string().optional(),
              photo: z.string(),
            }),
          ),
        }),
        org: z.object({
          headingLead: z.string(),
          headingAccent: z.string(),
          subheading: z.string(),
          root: z.string(),
          ceo: z.string(),
          departments: z.array(z.string()),
        }),
      })
      .optional(),
  }),
})

export default defineContentConfig({
  collections: { products, services, branches, jobs, news, legal, pages },
})
