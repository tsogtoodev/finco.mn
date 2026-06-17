// Types for the sealed user session (nuxt-auth-utils).
declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
  }
  interface UserSession {
    loggedInAt?: number
  }
}

export {}
