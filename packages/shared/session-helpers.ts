import { getServerSession } from "next-auth/next"
import { authOptions } from "@repo/auth"
import { redirect } from "next/navigation"
import { Role } from "@repo/database"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }
  return session
}

export async function requireRole(role: Role) {
  const session = await requireAuth()
  if (session.user.role !== role) {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }
  return session
}

export async function requireUserRole() {
  return await requireRole('USER' as Role)
}

export async function requireAdminRole() {
  return await requireRole('ADMIN' as Role)
}
