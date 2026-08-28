"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { freshOnboardingHref } from "@/lib/onboarding/paths";

const GUEST_NAV = [
  { id: "how", hash: "#how-it-works", path: "/#how-it-works", label: "Как это работает" },
  { id: "get", hash: "#what-you-get", path: "/#what-you-get", label: "Что ты получишь" },
  { id: "blog", hash: "/blog/", path: "/blog/", label: "Блог" },
] as const;

const headerBtnBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-grotesk transition active:scale-[0.98]";
const headerBtnDesktop = "h-8 min-w-[4.75rem] shrink-0 px-4 text-sm";
const headerBtnMobile = "h-11 w-full px-4 text-base";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const pathname = usePathname();
  const { user, hasPaidReport, startLogin } = useAuth();
  const onHome = pathname === "/" || pathname === "";
  const signedIn = Boolean(user);
  const startHref = freshOnboardingHref();
  const homeHref = signedIn ? "/account/" : onHome ? "#top" : "/";
  const ctaHref = hasPaidReport ? "/account/" : startHref;
  const ctaLabel = hasPaidReport ? "Моя карта" : "Начать путешествие";
  const onAccountSettings = pathname === "/account/settings" || pathname === "/account/settings/";
  const onBlog = isBlogPath(pathname);
  const nav = GUEST_NAV.map((item) => ({
    id: item.id,
    href: item.id === "blog" ? item.path : onHome ? item.hash : item.path,
    label: item.label,
    active: item.id === "blog" && onBlog,
  }));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  async function onLogin() {
    if (loginBusy) return;
    setLoginBusy(true);
    try {
      await startLogin("/account/");
    } catch {
      setLoginBusy(false);
    }
  }

  return (
    <header className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex justify-center px-4">
      {isOpen ? (
        <div
          aria-hidden
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 cursor-default bg-[#050d4a] lg:hidden"
        />
      ) : null}
      <div className="relative z-10 w-full max-w-5xl">
        <div
          className={`grid h-12 items-center gap-3 rounded-full border border-white/20 bg-[#050d4a]/55 px-4 shadow-[0_12px_40px_rgba(5,13,74,0.5)] backdrop-blur-2xl md:h-14 md:px-5 ${
            signedIn ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr]"
          }`}
        >
          <a href={homeHref} className="flex h-full min-w-0 items-center justify-self-start">
            <HeaderBrand />
          </a>

          {signedIn ? (
            <Link
              href="/account/settings/"
              aria-label="Аккаунт"
              aria-current={onAccountSettings ? "page" : undefined}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-full text-white/80 transition-colors hover:text-[#F6E7A1] ${
                onAccountSettings ? "text-[#F6E7A1]" : ""
              }`}
            >
              <CircleUser className="h-6 w-6" strokeWidth={1.7} aria-hidden />
            </Link>
          ) : (
            <>
              <nav className="hidden items-center justify-center gap-6 justify-self-center lg:flex">
                {nav.map((item) => (
                  <GuestNavLink
                    key={item.id}
                    href={item.href}
                    label={item.label}
                    active={item.active}
                    className={navLinkClass(item.active, "desktop")}
                  />
                ))}
              </nav>

              <div className="flex items-center justify-self-end">
                <div className="hidden items-center gap-2 lg:flex">
                  <SecondaryButton onClick={() => void onLogin()} busy={loginBusy}>
                    Войти
                  </SecondaryButton>
                  <a
                    href={ctaHref}
                    className={`${headerBtnBase} ${headerBtnDesktop} bg-[#F6E7A1] font-medium text-[#0a1a3a] shadow-[0_8px_20px_rgba(246,231,161,0.22)] hover:bg-[#f0dc82]`}
                  >
                    {ctaLabel}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-white/90 transition hover:text-[#F6E7A1] lg:hidden"
                  aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {!signedIn && isOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 flex flex-col gap-4 rounded-3xl border border-white/20 bg-[#050d4a] p-4 shadow-2xl lg:hidden">
            <nav className="flex flex-col items-center gap-3 text-center">
              {nav.map((item) => (
                <GuestNavLink
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  active={item.active}
                  className={navLinkClass(item.active, "mobile")}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              <SecondaryButton
                fullWidth
                busy={loginBusy}
                onClick={() => {
                  setIsOpen(false);
                  void onLogin();
                }}
              >
                Войти
              </SecondaryButton>
              <a
                href={ctaHref}
                onClick={() => setIsOpen(false)}
                className={`${headerBtnBase} ${headerBtnMobile} bg-[#F6E7A1] font-medium text-[#0a1a3a] shadow-[0_8px_20px_rgba(246,231,161,0.22)] hover:bg-[#f0dc82]`}
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function GuestNavLink({
  href,
  label,
  active,
  className,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  className: string;
  onClick?: () => void;
}) {
  const current = active ? "page" : undefined;
  if (href.startsWith("/blog")) {
    return (
      <Link href={href} onClick={onClick} className={className} aria-current={current}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} onClick={onClick} className={className} aria-current={current}>
      {label}
    </a>
  );
}

function navLinkClass(active: boolean, size: "desktop" | "mobile") {
  const sizeClass =
    size === "mobile"
      ? "flex min-h-11 w-full items-center justify-center font-grotesk text-base font-normal"
      : "whitespace-nowrap font-grotesk text-sm font-normal";
  const colorClass = active ? "text-[#F6E7A1]" : "text-white/70 hover:text-[#F6E7A1]";
  return `${sizeClass} ${colorClass} transition-colors`;
}

function isBlogPath(pathname: string) {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}

function HeaderBrand() {
  return (
    <span className="flex h-8 min-w-0 items-center gap-1">
      <span className="flex h-8 w-6 shrink-0 items-center justify-center">
        <Image
          src="/images/eye-silver.webp"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 object-contain object-center mix-blend-screen"
        />
      </span>
      <span className="font-display truncate text-lg leading-none tracking-tight text-white">
        Cosmirror
      </span>
    </span>
  );
}

export function SecondaryButton({
  children,
  onClick,
  busy = false,
  fullWidth = false,
  type = "button",
}: {
  children: string;
  onClick?: () => void;
  busy?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={`${headerBtnBase} border border-[#F6E7A1]/40 font-normal text-[#F6E7A1] hover:bg-[#F6E7A1]/10 disabled:opacity-50 ${
        fullWidth ? headerBtnMobile : headerBtnDesktop
      }`}
    >
      {children}
    </button>
  );
}

export function JourneyCta({
  label,
  paidLabel = "Моя карта",
  className,
}: {
  label: string;
  paidLabel?: string;
  className: string;
}) {
  const { hasPaidReport } = useAuth();
  const href = hasPaidReport ? "/account/" : freshOnboardingHref();
  const text = hasPaidReport ? paidLabel : label;
  return (
    <a href={href} className={className}>
      {text}
    </a>
  );
}
