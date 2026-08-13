export type NavAudience = 'individual' | 'business'

export interface NavPromo {
  variant: 'beep' | 'fincobiz'
  taglineKey: string
  logoAltKey: string
  logo: string
  ctaTo: string
}

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
