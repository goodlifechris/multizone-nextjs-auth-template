import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      isNewUser?: boolean
      hasActiveSubscription?: boolean
      isSuperAdmin?: boolean
      primaryTenantId?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    isNewUser?: boolean
    hasActiveSubscription?: boolean
    isSuperAdmin?: boolean
    primaryTenantId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    name?: string | null
    email?: string | null
    picture?: string | null
    role?: string
    isNewUser?: boolean
    hasActiveSubscription?: boolean
    isSuperAdmin?: boolean
    primaryTenantId?: string
  }
}