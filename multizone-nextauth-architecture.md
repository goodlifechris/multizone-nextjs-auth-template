# Next.js Multizone Architecture with Shared Authentication & Logout

## Project Structure

```
monorepo/
├── apps/
│   ├── host/                    # Main app (localhost:3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx                    # Landing page
│   │   │   │   ├── layout.tsx
│   │   │   │   └── api/
│   │   │   │       └── auth/
│   │   │   │           └── [...nextauth]/
│   │   │   │               └── route.ts
│   │   │   └── middleware.ts
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── .env.local
│   │
│   ├── user-app/                # User dashboard (localhost:3001)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx
│   │   │   └── middleware.ts
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── admin-app/               # Admin dashboard (localhost:3002)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── dashboard/
│       │   │       └── page.tsx
│       │   └── middleware.ts
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   ├── database/                # Shared Prisma
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── index.ts
│   │   └── package.json
│   │
│   ├── auth/                    # Shared NextAuth config
│   │   ├── index.ts
│   │   └── package.json
│   │
│   └── shared/                  # Shared utilities
│       ├── types.ts
│       ├── session-helpers.ts
│       └── package.json
│
├── package.json                 # Root package.json
├── turbo.json
└── .env
```

---

## 1. Root Configuration

### `package.json` (root)
```json
{
  "name": "multizone-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push"
  },
  "devDependencies": {
    "turbo": "^1.11.2"
  }
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

### `.env` (root - copy to each app as `.env.local`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/multizone_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App URLs
HOST_URL="http://localhost:3000"
USER_APP_URL="http://localhost:3001"
ADMIN_APP_URL="http://localhost:3002"
```

---

## 2. Database Package

### `packages/database/package.json`
```json
{
  "name": "@repo/database",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.9.1"
  },
  "devDependencies": {
    "prisma": "^5.9.1"
  }
}
```

### `packages/database/prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

enum Role {
  USER
  ADMIN
}
```

### `packages/database/index.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
```

---

## 3. Auth Package

### `packages/auth/package.json`
```json
{
  "name": "@repo/auth",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "dependencies": {
    "next-auth": "^4.24.5",
    "@auth/prisma-adapter": "^1.0.12",
    "@repo/database": "*"
  }
}
```

### `packages/auth/index.ts`
```typescript
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@repo/database"
import type { Adapter } from "next-auth/adapters"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // You can add custom logic here
      return true
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`)
    },
    async signOut({ session, token }) {
      console.log(`User signed out`)
    },
  },
}

export { prisma }
```

---

## 4. Shared Package

### `packages/shared/package.json`
```json
{
  "name": "@repo/shared",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "dependencies": {
    "next-auth": "^4.24.5"
  }
}
```

### `packages/shared/types.ts`
```typescript
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
```

### `packages/shared/session-helpers.ts`
```typescript
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
```

### `packages/shared/index.ts`
```typescript
export * from './types'
export * from './session-helpers'
```

---

## 5. Host App (Main Entry Point)

### `apps/host/package.json`
```json
{
  "name": "host",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.5",
    "@repo/database": "*",
    "@repo/auth": "*",
    "@repo/shared": "*"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
```

### `apps/host/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/user',
        destination: `${process.env.USER_APP_URL || 'http://localhost:3001'}/user`,
      },
      {
        source: '/user/:path*',
        destination: `${process.env.USER_APP_URL || 'http://localhost:3001'}/user/:path*`,
      },
      {
        source: '/admin',
        destination: `${process.env.ADMIN_APP_URL || 'http://localhost:3002'}/admin',
      },
      {
        source: '/admin/:path*',
        destination: `${process.env.ADMIN_APP_URL || 'http://localhost:3002'}/admin/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### `apps/host/src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@repo/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### `apps/host/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Multizone App',
  description: 'Next.js Multizone with Shared Auth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  }
}
```

### `apps/host/src/app/page.tsx`
```typescript
import { getServerSession } from "next-auth/next"
import { authOptions } from "@repo/auth"
import { redirect } from "next/navigation"
import SignInButton from "@/components/SignInButton"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect based on role
  if (session) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/user')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold">Welcome to Multizone App</h1>
          <p className="mt-4 text-gray-600">
            Sign in with Google to access your dashboard
          </p>
        </div>
        
        <div className="mt-8">
          <SignInButton />
        </div>
      </div>
    </main>
  )
}
```

### `apps/host/src/components/SignInButton.tsx`
```typescript
'use client'

import { signIn } from 'next-auth/react'

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center justify-center w-full px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Sign in with Google
    </button>
  )
}
```

### `apps/host/src/middleware.ts`
```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all routes except the home page and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 6. User App

### `apps/user-app/package.json`
```json
{
  "name": "user-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.5",
    "@repo/database": "*",
    "@repo/auth": "*",
    "@repo/shared": "*"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
```

### `apps/user-app/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/user',
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.HOST_URL || 'http://localhost:3000'}/api/auth/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### `apps/user-app/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getSession } from '@repo/shared'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'User Dashboard',
  description: 'User Dashboard',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }

  if (session.user.role !== 'USER') {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header user={session.user} />
        {children}
      </body>
    </html>
  )
}
```

### `apps/user-app/src/app/page.tsx`
```typescript
import { getSession } from '@repo/shared'

export default async function UserDashboard() {
  const session = await getSession()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session?.user.name}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Profile</h3>
            <p className="text-gray-600">View and edit your profile</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p className="text-gray-600">Manage your preferences</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Activity</h3>
            <p className="text-gray-600">View your recent activity</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {session?.user.name}</p>
            <p><span className="font-medium">Email:</span> {session?.user.email}</p>
            <p><span className="font-medium">Role:</span> {session?.user.role}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
```

### `apps/user-app/src/components/Header.tsx`
```typescript
'use client'

import { signOut } from 'next-auth/react'
import type { UserSession } from '@repo/shared'

export default function Header({ user }: { user: UserSession }) {
  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000' 
    })
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">User App</h1>
            <span className="text-sm text-gray-500">Welcome, {user.name}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
```

### `apps/user-app/src/middleware.ts`
```typescript
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
```

---

## 7. Admin App

### `apps/admin-app/package.json`
```json
{
  "name": "admin-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.5",
    "@repo/database": "*",
    "@repo/auth": "*",
    "@repo/shared": "*"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
```

### `apps/admin-app/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.HOST_URL || 'http://localhost:3000'}/api/auth/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### `apps/admin-app/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getSession } from '@repo/shared'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin Dashboard',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }

  if (session.user.role !== 'ADMIN') {
    redirect(process.env.HOST_URL || 'http://localhost:3000')
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header user={session.user} />
        {children}
      </body>
    </html>
  )
}
```

### `apps/admin-app/src/app/page.tsx`
```typescript
import { getSession } from '@repo/shared'
import { prisma } from '@repo/database'

export default async function AdminDashboard() {
  const session = await getSession()
  
  // Fetch all users for admin view
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session?.user.name}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Admins</h3>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.role === 'ADMIN').length}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.role === 'USER').length}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active</h3>
            <p className="text-3xl font-bold text-orange-600">{users.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
```

### `apps/admin-app/src/components/Header.tsx`
```typescript
'use client'

import { signOut } from 'next-auth/react'
import type { UserSession } from '@repo/shared'

export default function Header({ user }: { user: UserSession }) {
  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000' 
    })
  }

  return (
    <header className="bg-gray-900 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <span className="text-sm text-gray-300">Welcome, {user.name}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
```

### `apps/admin-app/src/middleware.ts`
```typescript
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

  // If not an ADMIN, redirect to host app
  if (token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(process.env.HOST_URL || 'http://localhost:3000', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 8. Setup Instructions

### Step 1: Initialize the project
```bash
# Create root directory
mkdir multizone-app && cd multizone-app

# Initialize root package.json
npm init -y

# Install turbo
npm install turbo -D

# Create directory structure
mkdir -p apps/host apps/user-app apps/admin-app
mkdir -p packages/database packages/auth packages/shared
```

### Step 2: Setup Database
```bash
cd packages/database

# Initialize package
npm init -y

# Install dependencies
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init

# Copy the schema.prisma content from above

# Generate Prisma Client
npx prisma generate

# Push to database
npx prisma db push
```

### Step 3: Setup each app
```bash
# For each app (host, user-app, admin-app):
cd apps/host  # or user-app or admin-app

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install dependencies
npm install next-auth @auth/prisma-adapter

# Copy the relevant files from above
```

### Step 4: Configure Environment Variables
Create `.env.local` in each app with:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/multizone_db"
NEXTAUTH_URL="http://localhost:3000"  # For host
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
HOST_URL="http://localhost:3000"
USER_APP_URL="http://localhost:3001"
ADMIN_APP_URL="http://localhost:3002"
```

### Step 5: Setup Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### Step 6: Run the apps
```bash
# From root directory
npm run dev

# Or run individually:
cd apps/host && npm run dev
cd apps/user-app && npm run dev
cd apps/admin-app && npm run dev
```

---

## 9. How It Works

### Authentication Flow:
1. User visits `localhost:3000` (host app)
2. User clicks "Sign in with Google"
3. NextAuth handles OAuth flow
4. User data is saved to database via Prisma
5. Based on role, user is redirected:
   - ADMIN → `localhost:3000/admin` (proxied to admin-app)
   - USER → `localhost:3000/user` (proxied to user-app)

### Session Sharing:
- All apps use the same `NEXTAUTH_SECRET`
- Session tokens are stored in the database
- Each app validates tokens against the shared database
- Middleware checks authentication on every request

### Logout Flow:
1. User clicks "Sign Out" in any app
2. `signOut()` is called from `next-auth/react`
3. Session is deleted from database
4. User is redirected to host app
5. All apps lose access since session token is invalid

### Access Control:
- User App: Only accessible to users with role "USER"
- Admin App: Only accessible to users with role "ADMIN"
- Middleware in each app validates role before rendering

---

## 10. Testing the Setup

### Create Test Users:
After first user signs in, manually update their role in the database:

```sql
-- Make user an admin
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- Keep user as regular user
UPDATE users SET role = 'USER' WHERE email = 'user@example.com';
```

Or use Prisma Studio:
```bash
cd packages/database
npx prisma studio
```

### Test Scenarios:
1. Sign in as regular user → Should see user dashboard
2. Sign out from user app → Should redirect to landing page
3. Sign in as admin → Should see admin dashboard
4. Sign out from admin app → Should redirect to landing page
5. Try accessing `/admin` as regular user → Should be blocked

---

## 11. Production Considerations

### Environment Variables:
Update URLs for production:
```env
NEXTAUTH_URL="https://yourdomain.com"
HOST_URL="https://yourdomain.com"
USER_APP_URL="https://user.yourdomain.com"
ADMIN_APP_URL="https://admin.yourdomain.com"
```

### Database:
- Use production PostgreSQL (e.g., Supabase, Railway, Neon)
- Run migrations: `npx prisma migrate deploy`

### Deployment Options:
- **Vercel**: Deploy each app separately with environment variables
- **Docker**: Containerize each app
- **Kubernetes**: Use separate deployments for each zone

### Security:
- Use HTTPS in production
- Secure your `NEXTAUTH_SECRET` (use strong random string)
- Configure proper CORS settings
- Add rate limiting
- Enable database connection pooling

---

This architecture provides a complete multizone setup with shared authentication, role-based access control, and proper logout functionality across all apps!