const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s().-]{8,20}$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    phone?: string
    type?: string
    message?: string
  }>(event)

  const name = body?.name?.trim()
  const email = body?.email?.trim()
  const phone = body?.phone?.trim()
  const type = body?.type?.trim()
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

  console.info('[contact] received feedback from', name, `<${email}>`, type ? `[${type}]` : '')

  return { ok: true }
})
