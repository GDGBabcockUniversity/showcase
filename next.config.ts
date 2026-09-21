import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: {
    qualities: [100, 75],
    formats: ["image/avif", "image/webp"],
    // Allow Next.js to optimize images served from UploadThing's CDN.
    // Both domains are used: ufs.sh is the newer primary CDN, utfs.io is the legacy one.
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh", pathname: "/**" },
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
    ],
  },
};

export default nextConfig;
