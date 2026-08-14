"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { freshOnboardingHref } from "@/lib/onboarding/paths";

const SECTION_NAV = [
  { hash: "#for", label: "Для кого" },
  { hash: "#how-it-works", label: "Как это работает" },
  { hash: "#get", label: "Что ты получишь" },
] as const;

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";
  const startHref = freshOnboardingHref();
  const homeHref = onHome ? "#top" : "/";
  const nav = [
    ...SECTION_NAV.map((item) => ({
      href: onHome ? item.hash : `/${item.hash}`,
      label: item.label,
    })),
    { href: "/blog/", label: "Блог" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 mx-auto flex justify-center px-4">
      <div className="relative flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border border-white/20 bg-[#050d4a]/55 py-2.5 pl-5 pr-2.5 shadow-[0_12px_40px_rgba(5,13,74,0.5)] backdrop-blur-2xl md:py-3 md:pl-7 md:pr-3">
        <a
          href={homeHref}
          className="text-lg font-medium transition hover:opacity-90"
        >
          <CosmirrorMark />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <a
          href={startHref}
          className="hidden md:inline-flex rounded-full bg-[#F6E7A1] px-4 py-1.5 font-grotesk text-sm font-medium text-[#0a1a3a] shadow-[0_8px_20px_rgba(246,231,161,0.22)] transition hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98]"
        >
          Начать путешествие
        </a>

        {/* Mobile Burger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center text-white/90 transition hover:text-white md:hidden"
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

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <>
            {/* Tap outside to close */}
            <div
              aria-hidden
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 cursor-default bg-transparent md:hidden"
            />
            <div className="absolute left-0 right-0 top-full mt-2 flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-[#050d4a]/92 p-5 shadow-2xl backdrop-blur-2xl md:hidden">
              <nav className="flex flex-col items-center gap-4 text-base font-medium text-white/90">
                {nav.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <a
                href={startHref}
                onClick={() => setIsOpen(false)}
                className="mt-1 w-full rounded-full bg-[#F6E7A1] py-2.5 text-center font-grotesk text-base font-medium text-[#0a1a3a] shadow-[0_8px_20px_rgba(246,231,161,0.22)] transition hover:bg-[#f0dc82]"
              >
                Начать путешествие
              </a>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
