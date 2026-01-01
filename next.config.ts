import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  /* config options here */
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
