export default function UserHome() {
  return (
    <div style={{ padding: 20, background: 'lightgreen' }}>
      <h1>✅ User App Homepage</h1>
      <p>This is the user app homepage at /user</p>
      <p>URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
      <a href="/">Go to Host App</a>
    </div>
  )
}