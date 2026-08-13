export default defineEventHandler((event) => {
  if (getCookie(event, PREVIEW_COOKIE)) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
