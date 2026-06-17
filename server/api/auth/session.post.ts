import { createRemoteJWKSet, jwtVerify } from 'jose'

// Firebase ID tokens are RS256 JWTs signed by Google's securetoken service.
// createRemoteJWKSet fetches + caches the public keys in-memory (Workers-safe,
// no firebase-admin needed). Module scope = cached across requests per isolate.
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
)

export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken?: string }>(event)
  if (!idToken) {
    throw createError({ statusCode: 400, statusMessage: 'Missing idToken' })
  }

  const projectId = useRuntimeConfig(event).public.firebase.projectId
  if (!projectId) {
    throw createError({ statusCode: 500, statusMessage: 'Firebase projectId not configured' })
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }))
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid ID token' })
  }

  await setUserSession(event, {
    user: {
      id: payload.sub!,
      name: (payload.name as string) ?? '',
      email: (payload.email as string) ?? '',
      avatar: payload.picture as string | undefined,
      provider: (payload.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider,
    },
    loggedInAt: Date.now(),
  })

  return { ok: true }
})
