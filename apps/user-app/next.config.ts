// apps/user-app/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  transpilePackages: [
    '@repo/database',
    '@repo/auth',
    '@repo/shared',

  ],
}

export default nextConfig
