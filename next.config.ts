import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["country-state-city"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/icon-:size(192|512).png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
