import type { ReactNode } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";

type LegalDocumentProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalDocument({ title, updatedAt, children }: LegalDocumentProps) {
  return (
    <main className="min-h-full bg-[#050d4a] text-[#f4efe8]">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-10 md:px-8 md:pt-14">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <span aria-hidden>←</span>
          На главную
        </a>

        <header className="mt-10 border-b border-white/10 pb-8">
          <p className="text-lg font-medium">
            <CosmirrorMark />
          </p>
          <h1 className="mt-3 text-3xl font-normal leading-tight tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/40">Дата публикации: {updatedAt}</p>
        </header>

        <div className="legal-prose mt-10 space-y-8 text-[15px] font-normal leading-relaxed text-white/80 md:text-base">
          {children}
        </div>

        <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-sm text-white/80">
          <a href="/privacy" className="transition hover:text-white">
            Политика конфиденциальности
          </a>
          <a href="/cookies" className="transition hover:text-white">
            Политика cookie
          </a>
          <a href="/terms" className="transition hover:text-white">
            Пользовательское соглашение
          </a>
          <a href="/offer" className="transition hover:text-white">
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

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-normal text-white md:text-2xl">{title}</h2>
      {children}
    </section>
  );
}
