import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getSession } from '@repo/shared'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Admin Panel - Multizone App',
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
