// Products-listing card sets + hero photos, keyed by audience.
// Repetitive, bilingual + shared with the detail/business pages, so it lives in
// typed data (not an inline array). Titles/FAQ copy live in i18n; this file only
// carries structure: ordered slugs (→ /products/[slug]) and their photos.
// Card titles resolve via i18n key `productsPage.cards.<slug>`.
export type Audience = 'individual' | 'business'

export interface ProductCardItem {
  /** drives the /products/[slug] link + the i18n title key */
  slug: string
  /** photo in public/images/products (served/optimised by @nuxt/image) */
  image: string
}

export const productListing: Record<Audience, ProductCardItem[]> = {
  individual: [
    { slug: 'collateral-loan', image: '/images/products/collateral.jpg' },
    { slug: 'auto-loan', image: '/images/products/auto.jpg' },
    { slug: 'green-loan', image: '/images/products/green.jpg' },
    { slug: 'consumer-loan', image: '/images/products/consumer.jpg' },
    { slug: 'salary-loan', image: '/images/products/salary.jpg' },
  ],
  business: [
    { slug: 'business-loan', image: '/images/products/collateral.jpg' },
    { slug: 'machinery-loan', image: '/images/products/machinery.jpg' },
    { slug: 'working-capital-loan', image: '/images/products/green.jpg' },
    { slug: 'investment-loan', image: '/images/products/investment.jpg' },
    { slug: 'women-business-loan', image: '/images/products/women.jpg' },
    { slug: 'green-business-loan', image: '/images/products/green.jpg' },
    { slug: 'concrete-loan', image: '/images/products/concrete.jpg' },
    { slug: 'quick-collateral-loan', image: '/images/products/consumer.jpg' },
  ],
}

export const heroPhoto: Record<Audience, string> = {
  individual: '/images/products/hero-individual.jpg',
  business: '/images/products/hero-business.jpg',
}
