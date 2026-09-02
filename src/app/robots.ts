import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "TelegramBot",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/s/", "/r/", "/account/", "/account/settings/"],
      },
    ],
  };
}
