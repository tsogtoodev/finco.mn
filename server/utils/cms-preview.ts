import type { H3Event } from 'h3'

export const PREVIEW_COOKIE = 'cms-preview'
export const PREVIEW_MAX_AGE = 60 * 30

export interface PreviewSessionData {
  c?: string
  id?: string
  s?: string
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

export async function getPreviewData(event: H3Event): Promise<PreviewSessionData | null> {
  if (!getCookie(event, PREVIEW_COOKIE)) return null
  const session = await previewSession(event)
  if (!session) return null
  const data = (await session).data
  return data?.c && data?.id ? data : null
}
