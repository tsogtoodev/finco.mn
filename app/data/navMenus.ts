// Static promo-card config for the two nav mega-menus (Figma 1:11916 / 1:11775).
// The menu LINKS are no longer listed here — SiteHeader queries the `products`
// collection (audience + order), so the catalog is managed in /content and the
// menus follow automatically. This file only keeps what has no CMS home: the
// promo card art/branding per audience. Taglines stay in i18n (`megaMenu.*`).
export type NavAudience = 'individual' | 'business'

export interface NavPromo {
  variant: 'beep' | 'fincobiz'
  /** i18n key for the tagline */
  taglineKey: string
  /** i18n key for the logo alt text */
  logoAltKey: string
  /** logo image (public/ asset) */
  logo: string
  /** promo CTA destination (localised at render) */
  ctaTo: string
}

export const navPromos: Record<NavAudience, NavPromo> = {
  individual: {
    variant: 'beep',
    taglineKey: 'megaMenu.beepTagline',
    logoAltKey: 'megaMenu.beepLogoAlt',
    logo: '/images/nav/beep-logo.png',
    ctaTo: '/products',
  },
  business: {
    variant: 'fincobiz',
    taglineKey: 'megaMenu.fincobizTagline',
    logoAltKey: 'megaMenu.fincobizLogoAlt',
    logo: '/images/nav/fincobiz-logo.png',
    ctaTo: '/business',
  },
}
