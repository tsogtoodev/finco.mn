// While a preview session cookie is present, every response — including SSR'd
// page HTML that may contain draft content — is uncacheable and unindexable
// (plan §7). Cookie-presence check only; the CMS endpoint does the real
// validation before serving any draft data.
export default defineEventHandler((event) => {
  if (getCookie(event, PREVIEW_COOKIE)) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
