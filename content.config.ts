import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const locale = z.enum(['mn', 'en'])

const link = z.object({
  label: z.string(),
  to: z.string(),
})

const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
})

const products = defineCollection({
  type: 'data',
  source: 'products/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    audience: z.enum(['individual', 'business']),
    title: z.string(),
    menuTitle: z.string().optional(),
    menuDesc: z.string().optional(),
    summary: z.string().optional(),
    category: z.string().optional(),
    heroImage: z.string().optional(),
    cardImage: z.string().optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
    loanTerms: z
      .object({
        amount: z.string(),
        rate: z.string(),
        period: z.string(),
      })
      .optional(),
    tabs: z
      .object({
        info: z.string().optional(),
        requirements: z.string().optional(),
        other: z.string().optional(),
      })
      .optional(),
    related: z.array(z.string()).optional(),
    faq: z.array(faqItem).optional(),
  }),
})

const services = defineCollection({
  type: 'data',
  source: 'services/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    breadcrumb: z.string().optional(),
    summary: z.string().optional(),
    heroImage: z.string().optional(),
    cta: link.optional(),
    order: z.number().optional(),
    related: z.array(z.string()).optional(),
    faq: z.array(faqItem).optional(),
  }),
})

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
    caption: z.string().optional(),
    mapImage: z.string().optional(),
    pin: z.object({ x: z.number(), y: z.number() }).optional(),
    coords: z.object({ lat: z.number(), lng: z.number() }),
    order: z.number().optional(),
  }),
})

const jobs = defineCollection({
  type: 'data',
  source: 'jobs/**/*.{md,yml,yaml}',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.string().optional(),
    postedAt: z.string().optional(),
    summary: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    applicationSections: z
      .array(
        z.object({
          id: z.string(),
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
    featured: z.boolean().optional(),
    to: z.string().optional(),
  }),
})

const legal = defineCollection({
  type: 'page',
  source: 'legal/**/*.md',
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
})

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
        accent: z.string().optional(),
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
    heroSlides: z
      .array(
        z.object({
          key: z.string(),
          tab: z.string(),
          headline: z.string(),
          subtext: z.string(),
          image: z.string().optional(),
        }),
      )
      .optional(),
    beep: z
      .object({
        heading: z.string(),
        subtext: z.string(),
        expandLead: z.string(),
        expandRest: z.string(),
        downloadLabel: z.string().optional(),
        qr: z.string().optional(),
      })
      .optional(),
    fincobiz: z
      .object({
        subtext: z.string(),
        calloutHeading: z.string(),
        calloutSubtext: z.string(),
        cards: z.record(
          z.enum(['request', 'receivables', 'eligibility']),
          z.union([
            z.string(),
            z.object({
              tab: z.string().optional(),
              heading: z.string().optional(),
              body: z.string().optional(),
            }),
          ]),
        ),
      })
      .optional(),
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
    about: z
      .object({
        hero: z.object({ headline: z.string(), intro: z.string(), photo: z.string() }),
        mission: z.object({
          blocks: z.array(z.object({ badge: z.string(), heading: z.string(), body: z.string() })),
        }),
        values: z.object({
          headingLead: z.string(),
          headingAccent: z.string(),
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
          headingLead: z.string(),
          headingAccent: z.string(),
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

const configuration = defineCollection({
  type: 'data',
  source: 'configuration/*.yml',
  schema: z.object({
    key: z.string(),
    value: z.string(),
    label: z.string().optional(),
    sort: z.number().optional(),
  }),
})

export default defineContentConfig({
  collections: { products, services, branches, jobs, news, legal, pages, configuration },
})
