
import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@repo/auth"
import Header from "./components/Header"
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rely - Work Better. Live Flourishing.",
  description: "The super app for SMEs. Automate your sales, manage your team, and find new opportunities.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect('/')
  const role = session.user.role?.toLowerCase()

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  return (
    <html lang="en">
        <head>
       <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
       </head>
      <body className={inter.className}>
      <Header user={session.user} />
        <main>{children}</main>
      </body>
    </html>
  )
}
