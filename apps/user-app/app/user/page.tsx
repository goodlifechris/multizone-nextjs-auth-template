// apps/user-app/app/user/page.tsx

'use client'

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function UserPage() {
  return (
    <div style={{ padding: 20, background: 'lightgreen' }}>
      <h1>✅ User App Homepage</h1>
      <p>This is the user app homepage at /user</p>
      <p>URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
      <a href="/">Go to Host App</a>
    </div>
  )
}


// export default function UserPage() {
//   const { data: session, status } = useSession()

//   useEffect(() => {
//     console.log('User Page - Status:', status)
//     console.log('User Page - Session:', session)
    
//     // DON'T redirect here - this might be the problem
//     // if (status === 'unauthenticated') {
//     //   window.location.href = 'http://localhost:3000'
//     // }
//   }, [session, status])

//   if (status === 'loading') {
//     return <div>Loading user dashboard...</div>
//   }

//   if (status === 'unauthenticated') {
//     return (
//       <div style={{ padding: 20 }}>
//         <h1>Access Denied</h1>
//         <p>You need to be signed in to access the user dashboard.</p>
//         <p>Please sign in from the host app.</p>
//       </div>
//     )
//   }

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>🎉 User Dashboard - Success!</h1>
//       <p>Welcome to the user app!</p>
//       <p>Email: {session?.user?.email}</p>
//       <p>Role: {session?.user?.role}</p>
//       <p>Name: {session?.user?.name}</p>
//       <button onClick={() => window.location.href = 'http://localhost:3000'}>
//         Go to Host App
//       </button>
//     </div>
//   )
// }