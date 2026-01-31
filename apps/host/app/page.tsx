import { getServerSession } from "next-auth"
import { authOptions } from "@repo/auth"
import Landing from "./components/Landing"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // if (session?.user) {
  //   const role = session.user.role?.toLowerCase()

  //   if (role === 'admin' || role === 'super_admin') {
  //     redirect('/admin')
  //   }

  //   redirect('/user')
  // }

  return <Landing session={session} />
}