import type { ReactNode } from "react";
import { Header } from "@/components/Header";

type BlogShellProps = {
  children: ReactNode;
};

/** Shared chrome for blog index and posts — Cosmirror world, reading mode. */
export function BlogShell({ children }: BlogShellProps) {
  return (
    <main className="min-h-full bg-[#050d4a] text-[#f4efe8]">
      <Header />
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-24 md:px-8 md:pt-28">
        {children}

        <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-sm text-white/80">
          <a href="/blog/" className="transition hover:text-white">
            Блог
          </a>
          <a href="/privacy/" className="transition hover:text-white">
            Политика конфиденциальности
          </a>
          <a href="/cookies/" className="transition hover:text-white">
            Политика cookie
          </a>
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
      </div>
    </main>
  );
}

export function BlogTitle({
  title,
  accent,
  as: Tag = "h1",
  className = "",
}: {
  title: string;
  accent?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  if (!accent || !title.includes(accent)) {
    return <Tag className={className}>{title}</Tag>;
  }

  const [before, after] = title.split(accent);
  return (
    <Tag className={className}>
      {before}
      <span className="font-display italic text-[#F6E7A1]">{accent}</span>
      {after}
    </Tag>
  );
}

export function ChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
