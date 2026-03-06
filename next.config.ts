import type { NextConfig } from "next";

const getConvexSiteUrl = () => {
  const value = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL;
  return value ? value.replace(/\/$/, "") : null;
};

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async rewrites() {
    const convexSiteUrl = getConvexSiteUrl();
    if (!convexSiteUrl) {
      return {
        beforeFiles: [],
        afterFiles: [],
        fallback: [],
      };
    }

    return {
      beforeFiles: [
        {
          source: "/api/auth",
          destination: `${convexSiteUrl}/api/auth`,
        },
        {
          source: "/api/auth/:path*",
          destination: `${convexSiteUrl}/api/auth/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
