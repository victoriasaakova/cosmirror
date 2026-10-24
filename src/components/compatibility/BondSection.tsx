"use client";

import { useState } from "react";
import type { BondCard } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

function groupsOf(bonds: BondCard[]) {
  const order: string[] = [];
  const map = new Map<string, BondCard[]>();
  for (const bond of bonds) {
    const list = map.get(bond.category);
    if (list) list.push(bond);
    else {
      order.push(bond.category);
      map.set(bond.category, [bond]);
    }
  }
  return order.map((category) => ({ category, cards: map.get(category) ?? [] }));
}

export function BondSection({ bonds }: { bonds: BondCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const groups = groupsOf(bonds);

  return (
    <section className="mt-20" aria-labelledby="bonds-title">
      <h2
        id="bonds-title"
        className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
      >
        Ваша связь
      </h2>
      <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-white/80">
        Что вас притягивает, поддерживает и создаёт напряжение.
      </p>
      <div className="mt-12 space-y-14">
        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="font-display text-2xl italic leading-[1.15] text-[#F6E7A1] md:text-3xl">{group.category}</h3>
            <div className="mt-6 space-y-3">
              {group.cards.map((card) => {
                const open = openId === card.id;
                return (
                  <article key={card.id} className={insightCardClass}>
                    <h4 className="font-grotesk text-xl font-normal leading-snug text-white sm:text-2xl">
                      {card.headline}
                    </h4>
                    <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-white/80">{card.insight}</p>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : card.id)}
                      className="mt-4 text-base text-[#F6E7A1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1]"
                    >
                      {open ? "Скрыть подробности" : "Читать подробнее"}
                    </button>
                    {open ? (
                      <div className="mt-4 max-w-[65ch]">
                        <p className="text-sm text-white/70">На чём основан разбор</p>
                        <p className="mt-2 text-base leading-relaxed text-white/80">{card.basis}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
