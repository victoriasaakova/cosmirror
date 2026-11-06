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
          <a href="/credits/" className="transition hover:text-white">
            Credits
          </a>
          <a href="mailto:hello@cosmirror.ru" className="transition hover:text-white">
            hello@cosmirror.ru
          </a>
        </nav>
        <section aria-labelledby="footer-credits" className="max-w-xl">
          <h2 id="footer-credits" className="text-sm text-white/80">
            Credits
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Тексты Таро:{" "}
            <a
              href="https://www.loveoracle.app"
              className="text-white/55 underline-offset-2 transition hover:text-white hover:underline"
            >
              Love Oracle
            </a>
            , лицензия{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              className="text-white/55 underline-offset-2 transition hover:text-white hover:underline"
            >
              CC BY 4.0
            </a>
            .{" "}
            <a
              href="/credits/"
              className="text-white/55 underline-offset-2 transition hover:text-white hover:underline"
            >
              Все источники
            </a>
            .
          </p>
        </section>
        <p className="text-xs leading-relaxed text-white/40">Саакова Виктория · ИНН 773180561611</p>
      </div>
    </footer>
  );
}
