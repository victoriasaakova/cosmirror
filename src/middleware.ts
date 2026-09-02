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
<html lang="ru" prefix="og: http://ogp.me/ns#">
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
<link rel="image_src" href="${SITE_OG_IMAGE}">
<link rel="icon" href="${SITE_FAVICON}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
</body>
</html>`;
}

const STATIC_FILE = /\.[a-zA-Z0-9]+$/;

function behindProxyUrl(request: NextRequest, pathname: string) {
  // Next's initUrl behind nginx is http://localhost:PORT. request.nextUrl is
  // https://localhost because of X-Forwarded-Proto; an absolute rewrite/redirect
  // to that origin is treated as an external proxy and returns 500.
  const dest = new URL(request.url);
  dest.protocol = "http:";
  dest.pathname = pathname;
  dest.search = request.nextUrl.search;
  dest.hash = "";
  return dest;
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === "www.cosmirror.ru") {
    const dest = new URL(`https://cosmirror.ru${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(dest, 301);
  }

  const { pathname } = request.nextUrl;

  // Do not 308 this path: Yandex OAuth lands here without a trailing slash.
  // next.config beforeFiles rewrites it internally to /onboarding/contacts/.
  if (pathname === "/onboarding/contacts") {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") || "";
  if (CRAWLER_UA.test(ua)) {
    const isHome = pathname === "/" || pathname === "";
    const isOg = pathname === "/og.html" || pathname === "/og.html/";
    if (isHome || isOg) {
      return new NextResponse(crawlerHtml(), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      });
    }
  }

  if (pathname !== "/" && !pathname.endsWith("/") && !STATIC_FILE.test(pathname)) {
    return NextResponse.redirect(behindProxyUrl(request, `${pathname}/`), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|images/|icons/|favicon.ico).*)"],
};
