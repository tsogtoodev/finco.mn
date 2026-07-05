// Custom @nuxt/image provider — identical to the built-in `cloudflare` provider
// (Cloudflare Image Transformations via /cdn-cgi/image/…), with two additions:
//   • defaults `format=auto` so Cloudflare negotiates AVIF/WebP per the browser's
//     Accept header (a per-image `format` prop still overrides it), and
//   • bypasses SVGs completely — transforming them rasterises the vector (and
//     Cloudflare doesn't accept SVG as a resize input anyway).
// Mirrors the keyMap/valueMap of node_modules/@nuxt/image/.../providers/cloudflare.js.
import { encodeQueryItem, joinURL } from 'ufo'

const KEY_MAP: Record<string, string> = {
  width: 'w',
  height: 'h',
  dpr: 'dpr',
  fit: 'fit',
  gravity: 'g',
  quality: 'q',
  format: 'f',
  sharpen: 'sharpen',
}

const VALUE_MAP: Record<string, Record<string, string>> = {
  fit: { cover: 'cover', contain: 'contain', fill: 'scale-down', outside: 'crop', inside: 'pad' },
  gravity: { auto: 'auto', side: 'side' },
}

function getImage(
  src: string,
  { modifiers = {}, baseURL = '/' }: { modifiers?: Record<string, unknown>; baseURL?: string } = {},
) {
  // Serve SVGs untouched (no /cdn-cgi/image/ transform).
  if (typeof src === 'string' && src.split('?')[0].toLowerCase().endsWith('.svg')) {
    return { url: src }
  }

  // Default to `format=auto` only when a per-image `format` wasn't set. (@nuxt/image
  // spreads `modifiers` with `format: undefined`, so a plain `{ format: 'auto',
  // ...modifiers }` would be clobbered.)
  const merged: Record<string, unknown> = { ...modifiers }
  if (merged.format === undefined) merged.format = 'auto'
  const operations = Object.entries(merged)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) =>
      encodeQueryItem(KEY_MAP[key] ?? key, (VALUE_MAP[key]?.[value as string] ?? value) as string),
    )
    .join(',')

  const url = operations ? joinURL(baseURL, 'cdn-cgi/image', operations, src) : src
  return { url }
}

// Matches @nuxt/image's defineProvider: a lazy singleton returning the impl.
export default (() => {
  let result: { getImage: typeof getImage } | undefined
  return () => (result ??= { getImage })
})()
