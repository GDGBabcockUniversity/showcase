import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: {
    qualities: [100, 75]
  }
};

export default nextConfig;
