
//packages/shared/session-helpers.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@repo/auth"
import { redirect } from "next/navigation"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth(returnUrl?: string) {
  const session = await getSession()
  if (!session) {
    // Redirect to host app's sign-in
    const signInUrl = `${process.env.HOST_URL || 'http://localhost:3000'}/auth/signin`;
    const redirectUrl = returnUrl ? `${signInUrl}?callbackUrl=${encodeURIComponent(returnUrl)}` : signInUrl;
    redirect(redirectUrl);
  }
  return session
}

export async function requireRole(role: string, appRedirect: string = '') {
  const session = await requireAuth(appRedirect)
  
  // Case-insensitive role comparison
  const userRole = session.user.role?.toLowerCase()
  const requiredRole = role.toLowerCase()
  
  if (userRole !== requiredRole) {
    // If user doesn't have the right role, redirect to appropriate app
    if (userRole === 'admin' || userRole === 'super_admin') {
      redirect(process.env.ADMIN_APP_URL || 'http://localhost:3002');
    } else if (userRole === 'user') {
      redirect(process.env.USER_APP_URL || 'http://localhost:3001');
    } else {
      redirect(process.env.HOST_URL || 'http://localhost:3000');
    }
  }
  
  return session
}

export async function requireUserRole() {
  return await requireRole('user', process.env.USER_APP_URL || 'http://localhost:3001')
}

export async function requireAdminRole() {
  return await requireRole('admin', process.env.ADMIN_APP_URL || 'http://localhost:3002')
}

// Helper to get normalized role
export function getNormalizedRole(role?: string): string {
  return role?.toLowerCase() || 'user'
}