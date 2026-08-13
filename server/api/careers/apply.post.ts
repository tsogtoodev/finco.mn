export default defineEventHandler(async (event) => {
  const body = await readBody<{ job?: string; fields?: Record<string, unknown> }>(event)

  if (!body?.job) {
    throw createError({ statusCode: 400, statusMessage: 'Missing job' })
  }

  console.info('[careers/apply] received application for', body.job, Object.keys(body.fields ?? {}))

  return { ok: true }
})
