import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel rejects request bodies over ~4.5 MB, so keep uploads under that
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
