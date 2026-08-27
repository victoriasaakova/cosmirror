"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeCookieConsent,
  writeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

type CookieConsentContextValue = {
  ready: boolean;
  choice: CookieConsentChoice | null;
  analyticsAllowed: boolean;
  openSettings: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const value = useContext(CookieConsentContext);
  if (!value) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return value;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ready = snapshot !== "ssr";
  const choice = snapshot === "ssr" ? null : snapshot;

  const decide = useCallback((next: CookieConsentChoice) => {
    const previous = getCookieConsentSnapshot();
    writeCookieConsent(next);
    setSettingsOpen(false);
    if (previous === "all" && next === "necessary") {
      window.location.reload();
    }
  }, []);

  const showBanner = snapshot === null || (ready && settingsOpen);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      ready,
      choice,
      analyticsAllowed: snapshot === "all",
      openSettings: () => setSettingsOpen(true),
    }),
    [ready, choice, snapshot],
  );

  useEffect(() => {
    if (!settingsOpen || choice === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, choice]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner ? (
        <CookieBanner onAccept={() => decide("all")} onNecessary={() => decide("necessary")} />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

function CookieBanner({
  onAccept,
  onNecessary,
}: {
  onAccept: () => void;
  onNecessary: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const sync = () => {
      const box = node.getBoundingClientRect();
      const styles = getComputedStyle(node);
      const margin =
        (Number.parseFloat(styles.marginTop) || 0) + (Number.parseFloat(styles.marginBottom) || 0);
      document.documentElement.style.setProperty(
        "--cookie-banner-clearance",
        `${Math.ceil(box.height + margin)}px`,
      );
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      document.documentElement.style.setProperty("--cookie-banner-clearance", "0px");
    };
  }, []);

  return (
    <div className="cookie-banner pointer-events-none fixed inset-x-0 bottom-0 flex justify-start">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-text"
        className="cookie-banner-panel pointer-events-auto m-4 w-[calc(100%-2rem)] max-w-lg rounded-2xl p-5 md:m-6 md:w-[min(36rem,calc(100%-3rem))]"
      >
        <p id="cookie-consent-title" className="text-base font-medium text-white">
          Файлы cookie
        </p>
        <p
          id="cookie-consent-text"
          className="mt-2 text-sm font-normal leading-relaxed text-white/70"
        >
          Мы используем файлы cookie, чтобы сайт работал правильно, а также в целях сбора аналитики
          и улучшения пользовательского опыта. Оставаясь на сайте, вы соглашаетесь с нашей{" "}
          <Link
            href="/privacy/"
            className="text-[#F6E7A1] underline underline-offset-2 transition hover:text-[#f0dc82]"
          >
            Политикой обработки персональных данных
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-primary w-full whitespace-nowrap px-5 text-sm sm:flex-1"
            onClick={onAccept}
          >
            Принять
          </button>
          <button
            type="button"
            className="btn-ghost w-full whitespace-nowrap px-5 text-sm sm:flex-1"
            onClick={onNecessary}
          >
            Только нужные
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ className = "" }: { className?: string }) {
  const { openSettings } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openSettings}
      className={`cursor-pointer border-0 bg-transparent p-0 font-grotesk text-sm text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1] ${className}`.trim()}
    >
      Настройки cookie
    </button>
  );
}
