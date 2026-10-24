"use client";

import { useState } from "react";
import type { DimensionInsight } from "@/lib/compatibility/types";
import { DimensionInsightCard } from "@/components/compatibility/DimensionInsightCard";

export function CompatibilityTabs({ dimensions }: { dimensions: DimensionInsight[] }) {
  const [activeId, setActiveId] = useState(dimensions[0]?.id ?? "");
  const active = dimensions.find((item) => item.id === activeId) ?? dimensions[0];
  if (!active) return null;

  return (
    <section className="mx-auto mt-16 w-full max-w-5xl" aria-labelledby="dimensions-title">
      <h2
        id="dimensions-title"
        className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
      >
        Как это устроено
      </h2>

      <div className="relative mt-8">
        <div
          role="tablist"
          aria-label="Темы связи"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
        {dimensions.map((item) => {
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              onClick={() => setActiveId(item.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1] active:scale-[0.98] ${
                selected
                  ? "border-[#F6E7A1]/45 bg-white/[0.06] text-[#F6E7A1]"
                  : "border-white/15 bg-white/[0.03] text-white/75 hover:border-[#F6E7A1] hover:text-[#F6E7A1]"
              }`}
            >
              {item.title}
            </button>
          );
        })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#050d4a] to-transparent md:hidden"
        />
      </div>

      <div
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
        className="mt-6"
      >
        <DimensionInsightCard dimension={active} />
      </div>
    </section>
  );
}
