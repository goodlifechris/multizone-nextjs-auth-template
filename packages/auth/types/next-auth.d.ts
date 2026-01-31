import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      isNewUser?: boolean
      hasActiveSubscription?: boolean
      isSuperAdmin?: boolean
      primaryTenantId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    role?: string
    isNewUser?: boolean
    hasActiveSubscription?: boolean
    isSuperAdmin?: boolean
    primaryTenantId?: string
  }

  interface JWT {
    id?: string
    role?: string
    isNewUser?: boolean
    hasActiveSubscription?: boolean
    isSuperAdmin?: boolean
    primaryTenantId?: string
    accessToken?: string
    provider?: string
    providerAccountId?: string
    picture?: string
  }
}