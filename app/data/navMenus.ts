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

/**
 * Every image NavPromoCard renders, with the `sizes` it renders them at.
 *
 * The mega-menu panel is `v-if`'d, so none of this art exists in the DOM until
 * the first hover — which is exactly when it becomes visible, so it pops in.
 * SiteHeader warms these after hydration (see `warmPromoArt`).
 *
 * `sizes` MUST mirror NavPromoCard's, or the warmed URL is a different
 * transform than the one the card later requests and the work is wasted.
 */
export const navPromoArt: { src: string; sizes: string }[] = [
  { src: '/images/nav/beep-dots.png', sizes: '320px' },
  { src: '/images/nav/beep-person.png', sizes: '320px' },
  { src: '/images/nav/fincobiz-laptop.png', sizes: '520px' },
  { src: '/images/nav/beep-logo.png', sizes: '90px' },
  { src: '/images/nav/fincobiz-logo.png', sizes: '115px' },
]

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
