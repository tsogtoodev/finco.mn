import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth'

// Client-only Firebase init. The sealed cookie (nuxt-auth-utils) is the source
// of truth for app session state, so Firebase itself need not persist — we keep
// its auth in memory and discard it right after exchanging the ID token.
export default defineNuxtPlugin(() => {
  const { firebase } = useRuntimeConfig().public

  const app = getApps().length ? getApp() : initializeApp({
    apiKey: firebase.apiKey,
    authDomain: firebase.authDomain,
    projectId: firebase.projectId,
    storageBucket: firebase.storageBucket,
    messagingSenderId: firebase.messagingSenderId,
    appId: firebase.appId,
  })

  const auth = getAuth(app)
  setPersistence(auth, inMemoryPersistence).catch(() => {})

  return {
    provide: { firebaseAuth: auth },
  }
})
