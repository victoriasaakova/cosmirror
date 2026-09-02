import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Match API OnboardingStep.url_path (`/onboarding/<slug>/`).
  trailingSlash: true,
  // Middleware handles trailing slashes so the Yandex OAuth return
  // (`/onboarding/contacts?code=`) is rewritten, not 308'd. Yandex's
  // mobile WebView treats that 308 as a login error.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/onboarding/contacts",
          destination: "/onboarding/contacts/",
        },
      ],
    };
  },
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
  // TelegramBot is missing from Next's default list; without this it may
  // stream scripts before OG tags, and Telegram's crawler then shows an empty card.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot/,
  async headers() {
    return [
      {
        source: "/s/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
