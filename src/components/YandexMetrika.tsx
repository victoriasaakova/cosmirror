"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/components/CookieConsent";

const YM_ID = 111358036;

export function YandexMetrika() {
  const pathname = usePathname();
  const { ready, analyticsAllowed } = useCookieConsent();
  if (!ready || !analyticsAllowed) return null;
  if (pathname.startsWith("/s/") || pathname.startsWith("/r/")) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">{`
      (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}', 'ym');

      ym(${YM_ID}, 'init', {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        accurateTrackBounce: true,
        trackLinks: true
      });
    `}</Script>
  );
}
