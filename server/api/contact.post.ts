// Contact feedback submit.
// STUB: validates the payload shape and acknowledges. Mirrors careers/apply.
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s().-]{8,20}$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    phone?: string
    message?: string
  }>(event)

  const name = body?.name?.trim()
  const email = body?.email?.trim()
  const phone = body?.phone?.trim()
  const message = body?.message?.trim()

  if (!name || !email || !phone || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }
  if (!emailRe.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
  if (!phoneRe.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid phone' })
  }

  // TODO(P8): persist the message (D1) and/or notify the team (email/webhook).
  // Wire the real handler here — do not hardcode a third-party endpoint.
  console.info('[contact] received feedback from', name, `<${email}>`)

  return { ok: true }
})
