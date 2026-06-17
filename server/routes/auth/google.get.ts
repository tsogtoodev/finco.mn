// Google SSO entry + callback. Authorized redirect URI to register in Google
// Cloud Console: <origin>/auth/google (e.g. https://finco.mn/auth/google,
// http://localhost:3000/auth/google).
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: user.sub,
        name: user.name,
        email: user.email,
        avatar: user.picture,
      },
      loggedInAt: Date.now(),
    })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
