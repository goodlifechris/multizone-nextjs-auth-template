import { getSession, useSession } from "next-auth/react"
import Header from "./components/Header"

export default async function AdminHome() {
  const session = await getSession()

  return (
    <div style={{ padding: 20, background: 'lightgreen' }}>
      <h1>✅ Admin App Homepage</h1>
      <p>This is the user app homepage at /user</p>
      <p>URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
      <a href="/">Go to Host App</a>
    </div>
  )
}