import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  /* config options here */
  /* config options here */
  output: process.env.NEXT_PUBLIC_BUILD_MODE === 'static' ? 'export' : undefined,
  // output: 'export', // Removed to enable dynamic API routes for Share Target

  images: {
    unoptimized: true,
  },
  turbopack: {}
};

export default withPWA({
  dest: "public",
  swSrc: "src/service-worker.ts",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
} as any)(nextConfig);
