import { NextRequest, NextResponse } from "next/server";
import {
  SITE_DESCRIPTION,
  SITE_FAVICON,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-meta";

const CRAWLER_UA =
  /TelegramBot|Twitterbot|facebookexternalhit|Facebot|WhatsApp|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|vkShare|Pinterest/i;

function attr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function crawlerHtml() {
  const title = attr(SITE_TITLE);
  const description = attr(SITE_DESCRIPTION);
  return `<!DOCTYPE html>
<html lang="ru" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(SITE_NAME)}">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${SITE_OG_IMAGE}">
<meta property="og:image:secure_url" content="${SITE_OG_IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(SITE_NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${SITE_OG_IMAGE}">
<link rel="icon" href="${SITE_FAVICON}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
</body>
</html>`;
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  if (!CRAWLER_UA.test(ua)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname !== "/" && pathname !== "") {
    return NextResponse.next();
  }

  return new NextResponse(crawlerHtml(), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|images/|icons/|favicon.ico).*)"],
};
