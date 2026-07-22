import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray ~/package-lock.json otherwise gets picked.
  turbopack: { root: __dirname },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
