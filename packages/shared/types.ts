import { Role } from "@repo/database"

export interface UserSession {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: Role
}

declare module "next-auth" {
  interface Session {
    user: UserSession
  }
  
  interface User {
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
  }
}
