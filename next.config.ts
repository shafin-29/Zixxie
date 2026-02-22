import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
      {
        protocol: "https",
        hostname: "seeklogo.com",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, dev, nextRuntime }) => {
    // Only apply webpack config when not using Turbopack
    if (process.env.TURBOPACK !== '1') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'drizzle-orm': false,
      };
    }
    return config;
  },
};

export default nextConfig;
