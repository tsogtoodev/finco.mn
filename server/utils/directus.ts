// Server-only Directus REST client (plan §8). The token never reaches the
// browser — this module must only be imported from server/ code.

export async function directusFetch<T = unknown>(
  path: string,
  query: Record<string, string | number> = {},
): Promise<T> {
  const config = useRuntimeConfig()
  if (!config.cmsUrl || !config.cmsToken) {
    throw createError({ statusCode: 503, statusMessage: 'CMS is not configured' })
  }
  try {
    const res = await $fetch<{ data: T }>(path, {
      baseURL: config.cmsUrl,
      query,
      headers: { Authorization: `Bearer ${config.cmsToken}` },
      // Strict upstream timeout: a slow CMS must not consume the Worker's
      // whole request budget (plan §8 caching rules).
      timeout: 5000,
      retry: 0,
    })
    return res.data
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    // Never forward Directus error bodies — they can describe internals.
    throw createError({
      statusCode: status === 403 || status === 401 ? 502 : 504,
      statusMessage: 'CMS upstream error',
    })
  }
}

/** Public URL for a Directus file. Prefers the R2 media hostname (bytes served
 *  by Cloudflare, never the VPS); falls back to the Directus assets endpoint. */
export function cmsAssetUrl(
  file: { id: string; filename_disk?: string | null } | null | undefined,
): string | undefined {
  if (!file?.id) return undefined
  const config = useRuntimeConfig()
  if (config.cmsMediaUrl && file.filename_disk) {
    return `${config.cmsMediaUrl.replace(/\/$/, '')}/${file.filename_disk}`
  }
  return `${(config.cmsUrl as string).replace(/\/$/, '')}/assets/${file.id}`
}
