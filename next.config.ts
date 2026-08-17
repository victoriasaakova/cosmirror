import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Match API OnboardingStep.url_path (`/onboarding/<slug>/`).
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/demo-return", destination: "/pay/failed/", permanent: false },
      { source: "/demo-return/", destination: "/pay/failed/", permanent: false },
    ];
  },
  // Serve images directly from /public so Cursor Simple Browser
  // preview works (it often breaks on /_next/image optimization).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
