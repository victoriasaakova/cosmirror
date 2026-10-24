"use client";

import { useCallback, useRef, useState } from "react";
import type { BondSummaryCard } from "@/lib/compatibility/types";

export function PairStories({ cards }: { cards: BondSummaryCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const syncActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(cards.length - 1, Math.max(0, next)));
  }, [cards.length]);

  const goTo = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: index * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }, []);

  if (cards.length === 0) return null;

  return (
    <section className="mx-auto mt-16 w-full max-w-3xl" aria-labelledby="between-title">
      <h2
        id="between-title"
        className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
      >
        Что между вами
      </h2>
      <div
        ref={scrollerRef}
        className="mt-8 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={syncActive}
      >
        {cards.map((card, index) => (
          <div key={card.id} className="min-w-0 max-w-full shrink-0 grow-0 basis-full snap-start">
            <article className="flex flex-col rounded-2xl border border-[#F6E7A1]/55 bg-white/[0.03] p-6 sm:min-h-[18rem] sm:p-7">
              <span className="self-end font-display text-xl italic leading-none text-[#F6E7A1]/80 sm:text-2xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 font-grotesk text-lg font-normal leading-snug text-[#F6E7A1] sm:text-xl">
                {card.role}
              </h3>
              <p className="mt-3 font-display text-2xl italic leading-snug text-white">{card.headline}</p>
              <p className="mt-3 text-sm font-normal leading-relaxed text-white/80 sm:text-[0.95rem]">{card.text}</p>
            </article>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center" role="tablist" aria-label="Темы связи">
        {cards.map((card, index) => {
          const selected = index === active;
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-label={card.role}
              aria-selected={selected}
              className="flex h-11 w-8 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1]"
              onClick={() => goTo(index)}
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  selected ? "bg-[#F6E7A1]" : "bg-[#4D6EC8]"
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
