"use client";

import { useState, type ReactNode } from "react";
import { aspectGlyph, planetGlyph, signGlyph } from "@/lib/astro-glyphs";
import {
  DEMO_ASPECTS,
  DEMO_CYCLES,
  DEMO_NATAL_GROUPS,
  DEMO_PRACTICE,
} from "@/lib/landing-demo";

/** В демо открыта только одна карточка: новая раскрывается, предыдущая закрывается. */
function useDemoExclusiveOpen(defaultKey: string) {
  const [openKey, setOpenKey] = useState(defaultKey);
  return [openKey, setOpenKey] as const;
}

function DemoChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`mt-0.5 h-4 w-4 shrink-0 text-[#F6E7A1] transition-transform duration-200 ease-out ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DemoAccordionCard({
  open,
  onOpen,
  header,
  children,
  className = "",
}: {
  open: boolean;
  onOpen: () => void;
  header: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-white/5 p-3.5 ${className}`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 text-left active:scale-[0.98]"
      >
        <span className="min-w-0">{header}</span>
        <DemoChevron open={open} />
      </button>
      {open ? <div className="mt-2.5 space-y-2">{children}</div> : null}
    </article>
  );
}

const ITEMS = [
  {
    title: "Расшифровка карты",
    text: "Разбор основных положений в натальной карте: Солнца, Луны, Асцендента, планет и домов. Что они могут говорить о характере, привычных реакциях, потребностях, сильных сторонах и способах действовать.",
  },
  {
    title: "Аспекты",
    text: "Разбор связей между планетами в карте. Где качества усиливают друг друга, где возникает напряжение и как такие сочетания могут проявляться в поведении, отношениях и решениях.",
  },
  {
    title: "Циклы",
    text: "Текущие транзиты к натальной карте и периоды, которые сейчас наиболее заметны. В отчёте показано, какая тема активна, насколько точен аспект и как она может ощущаться в жизни.",
  },
  {
    title: "Практика",
    text: "Раздел для самостоятельной работы с темами из отчёта. Здесь собраны наблюдения, вопросы и небольшие эксперименты, связанные с твоими аспектами, циклами и запросом из онбординга.",
  },
];

function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] leading-none ${
            value === key
              ? "bg-[#F6E7A1] text-[#0a1a3a]"
              : "border border-white/15 text-white/55"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PlacementMarks({
  items,
}: {
  items: (typeof DEMO_NATAL_GROUPS)[number]["items"];
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 text-right">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-baseline gap-1">
          <span className="natal-astro-glyph text-[13px] leading-none text-[#F6E7A1]">
            {planetGlyph(item.key)}
            {signGlyph(item.sign)}
          </span>
          <span className="text-[12px] text-white/70">
            {item.name} {item.signRu}
          </span>
        </span>
      ))}
    </span>
  );
}

function CoreCard({
  item,
  open,
  onOpen,
}: {
  item: (typeof DEMO_NATAL_GROUPS)[number]["items"][number];
  open: boolean;
  onOpen: () => void;
}) {
  const glyph = signGlyph(item.sign);
  return (
    <DemoAccordionCard
      open={open}
      onOpen={onOpen}
      header={
        <span className="text-sm font-medium text-white">
          <span className="mr-1.5 natal-astro-glyph text-[#F6E7A1]">
            {planetGlyph(item.key)}
          </span>
          {item.name}
          <span className="ml-2 inline-flex flex-wrap items-baseline gap-x-1.5 font-display italic text-[#F6E7A1]">
            {glyph ? (
              <span
                className="natal-astro-glyph text-[13px] font-normal not-italic leading-none"
                aria-hidden
              >
                {glyph}
              </span>
            ) : null}
            <span>{item.signRu}</span>
            {item.house ? <span>· дом {item.house}</span> : null}
          </span>
        </span>
      }
    >
      {item.headline ? <p className="text-sm text-white">{item.headline}</p> : null}
      {item.summary ? (
        <p className="text-xs leading-relaxed text-white/60">{item.summary}</p>
      ) : null}
      {item.houseNote ? (
        <p className="text-xs leading-relaxed text-white/45">{item.houseNote}</p>
      ) : null}
      {item.question ? (
        <p className="text-xs leading-relaxed text-white/55">{item.question}</p>
      ) : null}
    </DemoAccordionCard>
  );
}

function NatalPreview() {
  const core = DEMO_NATAL_GROUPS[0];
  const otherGroups = DEMO_NATAL_GROUPS.slice(1);
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="flex flex-col bg-[#050d4a] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-[#F6E7A1]/20 pb-3">
        <span className="text-lg text-white">Твоя карта</span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/40">
          пример отчёта
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {core.items.map((item) => (
          <CoreCard
            key={item.key}
            item={item}
            open={openKey === item.key}
            onOpen={() =>
              setOpenKey((current) => (current === item.key ? null : item.key))
            }
          />
        ))}
      </div>

      <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
        {otherGroups.map((group) => (
          <div
            key={group.title}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <p className="min-w-0 text-[12px] leading-snug text-white/45">
              {group.title}
            </p>
            <PlacementMarks items={group.items} />
          </div>
        ))}
      </div>
    </div>
  );
}

function aspectKey(card: (typeof DEMO_ASPECTS)[number]) {
  return `${card.a}-${card.aspect}-${card.b}`;
}

function visibleAspects(filter: "all" | "tension" | "resource") {
  if (filter === "all") return DEMO_ASPECTS;
  return DEMO_ASPECTS.filter((row) =>
    filter === "tension" ? row.category === "напряжение" : row.category === "ресурс",
  );
}

function visibleCycles(filter: "all" | "tension" | "support") {
  if (filter === "all") return DEMO_CYCLES;
  return DEMO_CYCLES.filter((row) =>
    filter === "tension" ? row.category === "напряжение" : row.category === "ресурс",
  );
}

function AspectsPreview() {
  const [filter, setFilter] = useState<"all" | "tension" | "resource">("all");
  const visible = visibleAspects(filter);
  const [openKey, setOpenKey] = useDemoExclusiveOpen(aspectKey(DEMO_ASPECTS[0]));

  return (
    <div className="flex flex-col bg-[#050d4a] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-[#F6E7A1]/20 pb-3">
        <span className="text-lg text-white">Аспекты</span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/40">
          пример отчёта
        </span>
      </div>
      <FilterChips
        className="mt-4"
        options={
          [
            ["all", "все"],
            ["tension", "напряжение"],
            ["resource", "ресурс"],
          ] as const
        }
        value={filter}
        onChange={(next) => {
          setFilter(next);
          const first = visibleAspects(next)[0];
          if (first) setOpenKey(aspectKey(first));
        }}
      />
      <div className="mt-3 space-y-2">
        {visible.map((card) => {
          const key = aspectKey(card);
          return (
            <DemoAccordionCard
              key={key}
              open={openKey === key}
              onOpen={() => setOpenKey(key)}
              header={
                <>
                  <span className="block text-[10px] font-medium tracking-tight text-[#F6E7A1]">
                    {card.category}
                    <span className="ml-2 tracking-normal text-white/40">
                      орб {card.orb}°
                    </span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-white">
                    <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
                      <span>{planetGlyph(card.a)}</span>
                      <span>{aspectGlyph(card.aspect)}</span>
                      <span>{planetGlyph(card.b)}</span>
                    </span>
                    <span>
                      {card.aName} {card.aspectRu} {card.bName}
                    </span>
                  </span>
                </>
              }
            >
              <p className="text-sm text-white">{card.headline}</p>
              <p className="text-xs leading-relaxed text-white/60">{card.summary}</p>
            </DemoAccordionCard>
          );
        })}
      </div>
    </div>
  );
}

function CyclesPreview() {
  const [filter, setFilter] = useState<"all" | "tension" | "support">("all");
  const visible = visibleCycles(filter);
  const [openKey, setOpenKey] = useDemoExclusiveOpen(DEMO_CYCLES[0].pair);

  return (
    <div className="flex flex-col bg-[#050d4a] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[#F6E7A1]/20 pb-3">
        <span className="text-lg text-white">Циклы</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
          что актуально сейчас
        </span>
      </div>
      <FilterChips
        className="mt-4"
        options={
          [
            ["all", "все"],
            ["tension", "напряжение"],
            ["support", "ресурс"],
          ] as const
        }
        value={filter}
        onChange={(next) => {
          setFilter(next);
          const first = visibleCycles(next)[0];
          if (first) setOpenKey(first.pair);
        }}
      />
      <div className="mt-3 space-y-2">
        {visible.map((card) => (
          <DemoAccordionCard
            key={card.pair}
            open={openKey === card.pair}
            onOpen={() => setOpenKey(card.pair)}
            header={
              <>
                <span className="block text-[10px] font-medium tracking-tight text-[#F6E7A1]">
                  {card.category}
                  <span className="ml-2 tracking-normal text-white/40">
                    орб {card.orb}°
                  </span>
                  <span className="ml-2 tracking-normal text-white/40">
                    {card.phase}
                  </span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-white">
                  <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
                    <span>{planetGlyph(card.transit)}</span>
                    <span>{aspectGlyph(card.aspect)}</span>
                    <span>{planetGlyph(card.natal)}</span>
                  </span>
                  <span>{card.pair}</span>
                </span>
              </>
            }
          >
            <p className="text-sm text-white">{card.theme}</p>
            {card.summary ? (
              <p className="text-xs leading-relaxed text-white/60">{card.summary}</p>
            ) : null}
            <p className="pt-1 text-[10px] uppercase tracking-[0.14em] text-[#F6E7A1]">
              окно цикла
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#F6E7A1]"
                style={{ width: `${card.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-white/45">{card.window}</p>
          </DemoAccordionCard>
        ))}
      </div>
    </div>
  );
}

function PracticePreview() {
  return (
    <div className="flex flex-col bg-[#050d4a] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[#F6E7A1]/20 pb-3">
        <span className="text-lg text-white">Практика</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
          рабочая тетрадь
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-3.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#F6E7A1]">
            Паттерн
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {DEMO_PRACTICE.patternText}
          </p>
        </article>
        <div className="grid grid-cols-2 gap-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#F6E7A1]">
              Как работать
            </p>
            <p className="mt-2.5 text-sm leading-snug text-[#F6E7A1]">
              {DEMO_PRACTICE.distinctionLeft} ≠ {DEMO_PRACTICE.distinctionRight}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              {DEMO_PRACTICE.distinctionNote}
            </p>
          </article>
          <article className="rounded-2xl border border-[#F6E7A1]/25 bg-[#F6E7A1]/08 p-3.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#F6E7A1]">
              Эксперимент
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-white/80">
              {DEMO_PRACTICE.experimentText}
            </p>
            {DEMO_PRACTICE.experimentDuration ? (
              <p className="mt-2 text-[10px] text-white/45">
                срок: {DEMO_PRACTICE.experimentDuration}
              </p>
            ) : null}
            <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#F6E7A1]/70">
              наблюдение по дням
            </p>
            <div className="mt-2 flex items-end gap-1.5" aria-hidden>
              {[40, 58, 46, 78, 64].map((height, index) => (
                <span
                  key={index}
                  className="w-2 rounded-full bg-[#F6E7A1]/70"
                  style={{ height: `${height / 2}px` }}
                />
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

const PREVIEWS = [NatalPreview, AspectsPreview, CyclesPreview, PracticePreview];

export function WhatYouGet() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ActivePreview = PREVIEWS[activeIndex];

  function onToggle(index: number) {
    if (activeIndex === index) {
      setActiveIndex((index + 1) % ITEMS.length);
      return;
    }
    setActiveIndex(index);
  }

  return (
    <section id="what-you-get" className="mt-28 scroll-mt-28">
      <h2 className="text-center text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
        Что ты{" "}
        <span className="font-display italic text-[#F6E7A1]">получишь</span>
      </h2>

      <div className="mt-14 grid items-start gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map((item, index) => {
            const isActive = activeIndex === index;
            const Preview = PREVIEWS[index];

            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => onToggle(index)}
                  aria-expanded={isActive}
                  aria-controls={`what-you-get-panel-${index}`}
                  className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1] md:min-h-20"
                >
                  <span
                    className={`min-w-0 text-left text-xl font-normal leading-tight transition-colors md:text-2xl ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg transition-all duration-300 ${
                      isActive
                        ? "rotate-45 border-[#F6E7A1] bg-[#F6E7A1] text-[#0a1a3a]"
                        : "border-white/20 text-white/55"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  id={`what-you-get-panel-${index}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm font-normal leading-relaxed text-white/80 md:pb-6 md:text-base">
                      {item.text}
                    </p>
                    {isActive ? (
                      <div className="mb-5 overflow-hidden rounded-2xl border border-[#F6E7A1]/55 bg-[#050d4a] lg:hidden">
                        <Preview />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative hidden overflow-hidden rounded-2xl border border-[#F6E7A1]/55 bg-[#050d4a] lg:block">
          <div
            key={activeIndex}
            className="animate-[fade-up_0.55s_cubic-bezier(0.22,1,0.36,1)_both]"
          >
            <ActivePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
