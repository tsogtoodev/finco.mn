// Sealed preview session (plan §7). The cookie is HttpOnly/Secure/SameSite=Lax,
// sealed with the preview secret, scoped to ONE collection+item, and expires
// after 30 minutes. Its presence switches the CMS endpoint into draft mode for
// exactly that item — nothing else.
import type { H3Event } from 'h3'

export const PREVIEW_COOKIE = 'cms-preview'
export const PREVIEW_MAX_AGE = 60 * 30

export interface PreviewSessionData {
  /** collection */
  c?: string
  /** Directus item id */
  id?: string
  /** slug (or pages key) — what public routes query by */
  s?: string
  /** content version name to apply, if previewing a version */
  v?: string | null
}

export function previewSession(event: H3Event) {
  const secret = useRuntimeConfig().cmsPreviewSecret
  if (!secret || secret.length < 32) return null
  return useSession<PreviewSessionData>(event, {
    name: PREVIEW_COOKIE,
    password: secret,
    maxAge: PREVIEW_MAX_AGE,
    cookie: { httpOnly: true, secure: true, sameSite: 'lax' },
  })
}

/** Valid preview session data, or null. Never creates a cookie when none exists. */
export async function getPreviewData(event: H3Event): Promise<PreviewSessionData | null> {
  if (!getCookie(event, PREVIEW_COOKIE)) return null
  const session = await previewSession(event)
  if (!session) return null
  const data = (await session).data
  return data?.c && data?.id ? data : null
}
