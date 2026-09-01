"use client";

import { CookieSettingsLink } from "@/components/CookieConsent";
import { CosmirrorMark } from "@/components/CosmirrorMark";

export function SiteFooter() {
  return (
    <footer
      className="site-footer relative z-10 mt-auto border-t border-white/10 bg-[#050d4a] pt-10"
      style={{ paddingBottom: "calc(2.5rem + var(--cookie-banner-clearance, 0px))" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-5 md:px-8">
        <p className="text-xl font-medium">
          <CosmirrorMark />
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
          <a href="/blog/" className="transition hover:text-white">
            Блог
          </a>
          <a href="/privacy/" className="transition hover:text-white">
            Политика конфиденциальности
          </a>
          <a href="/cookies/" className="transition hover:text-white">
            Политика cookie
          </a>
          <CookieSettingsLink className="transition hover:text-white" />
          <a href="/terms/" className="transition hover:text-white">
            Пользовательское соглашение
          </a>
          <a href="/offer/" className="transition hover:text-white">
            Публичная оферта
          </a>
          <a href="mailto:hello@cosmirror.ru" className="transition hover:text-white">
            hello@cosmirror.ru
          </a>
        </nav>
        <p className="text-xs leading-relaxed text-white/40">Саакова Виктория · ИНН 773180561611</p>
      </div>
    </footer>
  );
}
