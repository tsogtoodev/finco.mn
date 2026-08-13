export default defineEventHandler(async (event) => {
  const { registryNo, password } = await readBody<{ registryNo?: string; password?: string }>(event)

  if (!registryNo || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  throw createError({ statusCode: 501, statusMessage: 'Exam backend not implemented' })
})
