// Exam candidate login — SEPARATE from the Firebase user session.
// STUB: validates input shape only. Wire to the real candidate credential
// store (D1 table or external exam API) + issue a scoped exam session here.
export default defineEventHandler(async (event) => {
  const { registryNo, password } = await readBody<{ registryNo?: string; password?: string }>(event)

  if (!registryNo || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  // TODO(P8): look up the candidate by registry number, verify the password,
  // then setUserSession with an `exam` scope (or a dedicated sealed cookie) and
  // redirect to the exam. Until that backend exists, reject so the UI shows the
  // error state rather than a false success.
  throw createError({ statusCode: 501, statusMessage: 'Exam backend not implemented' })
})
