"use client";

import { useEffect, useState } from "react";

const NAV = [
  { href: "#for", label: "Для кого" },
  { href: "#how-it-works", label: "Как это работает" },
  { href: "#get", label: "Что ты получишь" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="fixed inset-x-0 top-4 z-50 mx-auto px-4 flex justify-center">
      <div className="relative flex w-full max-w-4xl items-center justify-between rounded-full border border-white/20 bg-black/50 px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:px-7 md:py-3.5">
        <a
          href="#top"
          className="font-display text-xl font-medium tracking-tight text-white transition hover:opacity-90"
        >
          Cosmirror
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <a
          href="/onboarding?new=1"
          className="hidden md:inline-flex rounded-full bg-white hover:bg-zinc-100 text-black font-display text-sm font-semibold px-5 py-2 shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Начать путешествие
        </a>

        {/* Mobile Burger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center text-white/90 transition hover:text-white md:hidden"
          aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
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
            <div className="absolute left-0 right-0 top-full mt-3 flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-black/85 p-6 shadow-2xl backdrop-blur-2xl md:hidden">
            <nav className="flex flex-col items-center gap-4 text-base font-medium text-white/90">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="transition hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href="/onboarding?new=1"
              onClick={() => setIsOpen(false)}
              className="mt-2 w-full rounded-full bg-white text-center text-black font-display text-base font-semibold py-3 shadow-md transition hover:bg-zinc-100"
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
