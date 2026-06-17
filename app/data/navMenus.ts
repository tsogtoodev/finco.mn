// Mega-menu structure for the two nav dropdowns (Figma 1:11916 / 1:11775).
// The link titles/descriptions ARE the products catalog, so this file carries
// only structure: the ordered slugs per menu (→ /products/[slug]) plus the
// static promo-card config. Copy lives in i18n under `megaMenu.*`:
//   • link title  → megaMenu.items.<slug>.title
//   • link desc   → megaMenu.items.<slug>.desc
//   • section/promo strings → megaMenu.<key>
//
// Items are listed in COLUMN-MAJOR order: NavMegaMenu splits them into two
// columns with ceil(n/2) items in the first, matching the Figma layout
// (Иргэнд: 3 + 2, Бизнесд: 4 + 4).
export type NavAudience = 'individual' | 'business'

export interface NavPromo {
  variant: 'beep' | 'fincobiz'
  /** i18n key for the tagline */
  taglineKey: string
  /** i18n key for the logo alt text */
  logoAltKey: string
  /** logo image (imported asset) */
  logo: string
  /** promo CTA destination (localised at render) */
  ctaTo: string
}

export interface NavMenuConfig {
  /** i18n key for the small section label above the grid */
  labelKey: string
  /** ordered product slugs (column-major) */
  slugs: string[]
  /** which side the promo card sits on */
  promoSide: 'left' | 'right'
  promo: NavPromo
}

export const navMenus: Record<NavAudience, NavMenuConfig> = {
  individual: {
    labelKey: 'megaMenu.individualLabel',
    slugs: ['consumer-loan', 'green-loan', 'auto-loan', 'collateral-loan', 'salary-loan'],
    promoSide: 'left',
    promo: {
      variant: 'beep',
      taglineKey: 'megaMenu.beepTagline',
      logoAltKey: 'megaMenu.beepLogoAlt',
      logo: '/images/nav/beep-logo.png',
      ctaTo: '/products',
    },
  },
  business: {
    labelKey: 'megaMenu.businessLabel',
    slugs: [
      'business-loan',
      'working-capital-loan',
      'investment-loan',
      'concrete-loan',
      'machinery-loan',
      'women-business-loan',
      'green-business-loan',
      'quick-collateral-loan',
    ],
    promoSide: 'right',
    promo: {
      variant: 'fincobiz',
      taglineKey: 'megaMenu.fincobizTagline',
      logoAltKey: 'megaMenu.fincobizLogoAlt',
      logo: '/images/nav/fincobiz-logo.png',
      ctaTo: '/business',
    },
  },
}
