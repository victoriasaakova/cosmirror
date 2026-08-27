import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Match API OnboardingStep.url_path (`/onboarding/<slug>/`).
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/demo-return", destination: "/pay/failed/", permanent: false },
      { source: "/demo-return/", destination: "/pay/failed/", permanent: false },
      { source: "/onboarding/intent", destination: "/onboarding/goal/", permanent: false },
      { source: "/onboarding/intent/", destination: "/onboarding/goal/", permanent: false },
      { source: "/onboarding/chart_knowledge", destination: "/onboarding/astrolevel/", permanent: false },
      { source: "/onboarding/chart_knowledge/", destination: "/onboarding/astrolevel/", permanent: false },
      { source: "/onboarding/astrology_trigger", destination: "/onboarding/questions/", permanent: false },
      { source: "/onboarding/astrology_trigger/", destination: "/onboarding/questions/", permanent: false },
      { source: "/report", destination: "/account/", permanent: false },
      { source: "/report/", destination: "/account/", permanent: false },
      { source: "/report/:orderId", destination: "/account/", permanent: false },
      { source: "/report/:orderId/", destination: "/account/", permanent: false },
    ];
  },
  // Serve images directly from /public so Cursor Simple Browser
  // preview works (it often breaks on /_next/image optimization).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
