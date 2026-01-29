/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.HOST_URL || 'http://localhost:3000'}/api/auth/:path*`,
      },
    ]
  },
  transpilePackages: ['@repo/database', '@repo/auth', '@repo/shared'],
}

module.exports = nextConfig
