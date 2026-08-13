export async function directusFetch<T = unknown>(
  path: string,
  query: Record<string, string | number> = {},
  opts: { preview?: boolean } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const token = opts.preview ? config.cmsPreviewToken : config.cmsToken
  if (!config.cmsUrl || !token) {
    throw createError({ statusCode: 503, statusMessage: 'CMS is not configured' })
  }
  try {
    const res = await $fetch<{ data: T }>(path, {
      baseURL: config.cmsUrl,
      query,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
      retry: 0,
    })
    return res.data
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    throw createError({
      statusCode: status === 403 || status === 401 ? 502 : 504,
      statusMessage: 'CMS upstream error',
    })
  }
}

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
