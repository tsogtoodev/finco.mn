// Geo-aware default locale for first-time visitors landing on the bare `/`.
//
// The i18n `prefix` strategy leaves `/` locale-less; we decide the prefix here
// (before the Nuxt app renders) so international visitors default to English and
// visitors from Mongolia default to Mongolian:
//
//   1. A stored `finco_locale` cookie always wins — respects a returning visitor
//      and any manual choice made via the language switcher (i18n writes the same
//      cookie), so we never override an explicit preference.
//   2. Otherwise Cloudflare's `CF-IPCountry` header decides: MN → mn, else → en.
//   3. Where that header is absent (local dev, some proxies) we fall back to the
//      browser's Accept-Language, then to English.
//
// Only the exact root path is touched — every prefixed route, asset, API and
// /_studio request passes straight through, so there's no redirect loop.
const LOCALES = ['mn', 'en'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(v: string | undefined): v is Locale {
  return v === 'mn' || v === 'en'
}

// Pick mn/en from an Accept-Language header, honouring listed order; default en.
function fromAcceptLanguage(header: string | undefined): Locale {
  if (!header) return 'en'
  for (const part of header.split(',')) {
    const tag = part.trim().split(';')[0]?.toLowerCase() ?? ''
    if (tag.startsWith('mn')) return 'mn'
    if (tag.startsWith('en')) return 'en'
  }
  return 'en'
}

export default defineEventHandler((event) => {
  // Query string is included in event.path, so parse the pathname explicitly.
  const url = getRequestURL(event)
  if (url.pathname !== '/') return

  // 1. Honour an existing/manual preference.
  const cookie = getCookie(event, 'finco_locale')
  if (isLocale(cookie)) {
    return sendRedirect(event, `/${cookie}${url.search}`, 302)
  }

  // 2. Cloudflare geolocation (header, or the cf context object as a fallback).
  const country = (
    getRequestHeader(event, 'cf-ipcountry')
    ?? (event.context.cf as { country?: string } | undefined)?.country
    ?? ''
  ).toUpperCase()

  let locale: Locale
  if (country === 'MN') {
    locale = 'mn'
  }
  else if (country && country !== 'XX' && country !== 'T1') {
    // Known non-MN country → international default.
    locale = 'en'
  }
  else {
    // 3. No usable country (dev / unknown) → browser language, then English.
    locale = fromAcceptLanguage(getRequestHeader(event, 'accept-language'))
  }

  return sendRedirect(event, `/${locale}${url.search}`, 302)
})
