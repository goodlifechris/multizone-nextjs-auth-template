import "@repo/tailwind/globals.css";
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@repo/auth"
import Header from "./components/Header"
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect('/')
  const role = session.user.role?.toLowerCase()

  if (role == 'admin' || role == 'super_admin') {
    redirect('/')
  }

  return (
    <html lang="en">
        <head>
       <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
       </head>
      <body>
        <Header user={session.user} />
        <main>{children}</main>
      </body>
    </html>
  )
}
