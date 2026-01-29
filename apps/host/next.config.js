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
        destination: `${process.env.ADMIN_APP_URL || 'http://localhost:3002'}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${process.env.ADMIN_APP_URL || 'http://localhost:3002'}/admin/:path*`,
      },
    ]
  },
  transpilePackages: ['@repo/database', '@repo/auth', '@repo/shared'],
}

module.exports = nextConfig
