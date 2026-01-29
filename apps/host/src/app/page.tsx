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
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to access your dashboard
          </p>
        </div>
        
        <div className="space-y-4">
          <SignInButton />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Secure authentication powered by NextAuth
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>This is a multizone Next.js application</p>
        <p className="mt-2">
          <span className="font-semibold">User Dashboard</span> for regular users |{' '}
          <span className="font-semibold">Admin Panel</span> for administrators
        </p>
      </div>
    </main>
  )
}
