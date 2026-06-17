// Job application submit.
// STUB: accepts the JSON field payload and acknowledges. Real implementation
// needs multipart/form-data for file uploads (CV) → NuxtHub blob storage.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ job?: string; fields?: Record<string, unknown> }>(event)

  if (!body?.job) {
    throw createError({ statusCode: 400, statusMessage: 'Missing job' })
  }

  // TODO(P8): persist the application (D1) and store uploaded files via
  // hubBlob().put(...) once the form posts multipart/form-data. Optionally
  // notify HR (email/webhook). For now we acknowledge the submission shape.
  console.info('[careers/apply] received application for', body.job, Object.keys(body.fields ?? {}))

  return { ok: true }
})
