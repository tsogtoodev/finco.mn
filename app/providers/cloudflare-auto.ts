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
  if (typeof src === 'string' && src.split('?')[0].toLowerCase().endsWith('.svg')) {
    return { url: src }
  }

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

export default (() => {
  let result: { getImage: typeof getImage } | undefined
  return () => (result ??= { getImage })
})()
