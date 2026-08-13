const LOCALES = ['mn', 'en'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(v: string | undefined): v is Locale {
  return v === 'mn' || v === 'en'
}

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
  const url = getRequestURL(event)
  if (url.pathname !== '/') return

  const cookie = getCookie(event, 'finco_locale')
  if (isLocale(cookie)) {
    return sendRedirect(event, `/${cookie}${url.search}`, 302)
  }

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
    locale = 'en'
  }
  else {
    locale = fromAcceptLanguage(getRequestHeader(event, 'accept-language'))
  }

  return sendRedirect(event, `/${locale}${url.search}`, 302)
})
