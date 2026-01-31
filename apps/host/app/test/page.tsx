// apps/host/app/test-multi-zone/page.tsx
'use client'

export default function TestMultiZone() {
  const testLinks = [
    { href: '/', label: 'Home (Host App)' },
    { href: '/user', label: 'User App' },
    { href: '/admin', label: 'Admin App' },
  ]

  return (
    <div style={{ padding: 20 }}>
      <h1>Multi-Zone Test</h1>
      <p>Testing navigation between zones:</p>
      <ul>
        {testLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} style={{ color: 'blue', textDecoration: 'underline' }}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p>All links should work and maintain the same session.</p>
    </div>
  )
}