import type { NextConfig } from "next";

const cdsDiscoveryCorsHeaders = [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
  { key: "Content-Type", value: "application/json" },
] as const;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/webp", "image/avif"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [...cdsDiscoveryCorsHeaders],
      },
      {
        source: "/.well-known/cds-services/:path*",
        headers: [...cdsDiscoveryCorsHeaders],
      },
    ];
  },
};

export default nextConfig;
