import type { NextConfig } from "next";

const rewriteApiTarget =
  process.env.API_PROXY_TARGET ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5050";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    // In local Next.js dev, proxy /api to backend service.
    // In Vercel environments, platform routing handles /api.
    if (process.env.VERCEL) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${rewriteApiTarget.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
