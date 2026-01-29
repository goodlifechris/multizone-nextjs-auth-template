import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If no token, redirect to host app
  if (!token) {
    return NextResponse.redirect(new URL(process.env.HOST_URL || 'http://localhost:3000', request.url))
  }

  // If not a USER, redirect to host app
  if (token.role !== 'USER') {
    return NextResponse.redirect(new URL(process.env.HOST_URL || 'http://localhost:3000', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
