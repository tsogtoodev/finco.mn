import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'

// Client-side auth actions. Firebase drives provider sign-in; we exchange the
// resulting ID token for our sealed-cookie session, then drop the Firebase
// session so the cookie (useUserSession) is the single source of truth.
export function useFirebaseAuth() {
  const { $firebaseAuth } = useNuxtApp()
  const { fetch: refreshSession, clear } = useUserSession()

  async function exchangeAndPersist(user: FirebaseUser) {
    const idToken = await user.getIdToken()
    await $fetch('/api/auth/session', { method: 'POST', body: { idToken } })
    await refreshSession()
    await firebaseSignOut($firebaseAuth)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup($firebaseAuth, provider)
    await exchangeAndPersist(credential.user)
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
  }

  // Future providers (email/password, phone OTP, Apple, …) call exchangeAndPersist
  // with their Firebase user the same way — no server changes required.
  return { signInWithGoogle, logout, exchangeAndPersist }
}
