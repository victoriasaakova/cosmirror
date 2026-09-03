"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

export type HowCard = {
  title: string;
  text: string;
  image: string;
};

function Card({ card, index }: { card: HowCard; index: number }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-[#F6E7A1]/55 bg-white/[0.03] p-6 backdrop-blur-md sm:p-7 sm:transition-all sm:duration-300 sm:hover:-translate-y-1.5 sm:hover:border-[#F6E7A1]/80 sm:hover:bg-white/[0.06]">
      <span className="mb-3 self-end font-display text-xl italic leading-none text-[#F6E7A1]/80 sm:text-2xl">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="mb-4 flex h-28 w-full items-start justify-start sm:h-32 md:h-36">
        <Image
          src={card.image}
          alt=""
          width={196}
          height={196}
          className="h-full w-auto max-w-full object-contain object-left"
          sizes="(max-width: 768px) 80vw, 40vw"
        />
      </div>
      <h3 className="mb-3 text-lg font-normal leading-snug text-[#F6E7A1] sm:text-xl">
        {card.title}
      </h3>
      <p className="text-sm font-normal leading-relaxed text-white/80 sm:text-[0.95rem]">
        {card.text}
      </p>
    </article>
  );
}

export function HowItWorksCards({ cards }: { cards: HowCard[] }) {
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
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  return (
    <>
      <div className="mt-14 sm:hidden">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={syncActive}
        >
          {cards.map((card, index) => (
            <div
              key={card.title}
              className="min-w-0 max-w-full shrink-0 grow-0 basis-full snap-start"
            >
              <Card card={card} index={index} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2.5" role="tablist" aria-label="Шаги">
          {cards.map((card, index) => {
            const selected = index === active;
            return (
              <button
                key={card.title}
                type="button"
                role="tab"
                aria-label={`Шаг ${index + 1}`}
                aria-selected={selected}
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  selected ? "bg-[#F6E7A1]" : "bg-[#4D6EC8]"
                }`}
                onClick={() => goTo(index)}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-14 hidden gap-6 sm:grid sm:grid-cols-2">
        {cards.map((card, index) => (
          <Card key={card.title} card={card} index={index} />
        ))}
      </div>
    </>
  );
}
