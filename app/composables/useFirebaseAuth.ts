import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'

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

  return { signInWithGoogle, logout, exchangeAndPersist }
}
