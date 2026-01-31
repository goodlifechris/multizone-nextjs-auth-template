// apps/host/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  async rewrites() {
    const userApp = process.env.NEXT_PUBLIC_USER_APP_URL;
    const adminApp = process.env.NEXT_PUBLIC_ADMIN_APP_URL;
    const tenantApp = process.env.NEXT_PUBLIC_TENANT_APP_URL;

    // If any URL is missing, return an empty array
    if (!userApp || !adminApp || !tenantApp) {
      console.error("❌ Missing app URLs");
      return [];
    }

    return [
      // USER ZONE
      { source: "/user", destination: userApp },
      { source: "/user/:path*", destination: `${userApp}/:path*` },

      // ADMIN ZONE
      { source: "/admin", destination: adminApp },
      { source: "/admin/:path*", destination: `${adminApp}/:path*` },

      // TENANT ZONE
      { source: "/tenant", destination: tenantApp },
      { source: "/tenant/:path*", destination: `${tenantApp}/:path*` },
    ];
  },

  transpilePackages: [
    "@repo/database",
    "@repo/auth",
    "@repo/shared",
    "@repo/tailwind",
  ],
};

export default nextConfig;
