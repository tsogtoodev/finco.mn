declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
    provider?: string
  }
  interface UserSession {
    loggedInAt?: number
  }
}

export {}
