"use client";

import { useMemo, useState } from "react";
import { NatalWheel } from "@/components/NatalWheel";
import type { PaidReport, ReportDocument, ReportTransitHit } from "@/lib/api";

type PolarityFilter = "all" | "pressure" | "resource";

const CORE = ["sun", "moon", "ascendant"] as const;

export function InteractiveReport({ report }: { report: PaidReport }) {
  const document = report.document;
  const tabs = document?.presentation?.web?.tabs ?? [];
  const defaultTab = document?.presentation?.web?.default_tab || tabs[0]?.id || "natal";
  const [tab, setTab] = useState(defaultTab);
  const [openPlanet, setOpenPlanet] = useState<string | null>(CORE[0]);
  const [periodFilter, setPeriodFilter] = useState<PolarityFilter>("all");
  const wheel = document?.factual?.natal?.wheel;

  if (!document || tabs.length === 0) {
    return <LinearSections report={report} />;
  }

  return (
    <div className="mt-10 pb-20">
      <p className="text-xs uppercase tracking-[0.18em] text-[#F6E7A1]">Отчёт</p>
      <h1 className="mt-3 font-display text-3xl italic leading-tight text-white sm:text-4xl">
        {report.title}
      </h1>
      {report.subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-white/55">{report.subtitle}</p>
      ) : null}

      {wheel?.planets?.length ? (
        <div className="mx-auto mt-8 max-w-[28rem]">
          <div className="rounded-[2rem] border border-[#F6E7A1]/25 bg-[#071240] p-3 sm:p-4">
            <NatalWheel wheel={wheel} />
          </div>
          <p className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-white/40">
            Натальная карта · знаки · аспекты
          </p>
        </div>
      ) : null}

      <div className="mt-8 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-[#F6E7A1] text-[#0a1a3a]"
                  : "border border-white/15 text-white/70 hover:border-[#F6E7A1]/50 hover:text-[#F6E7A1]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-white/45">{tabs.find((item) => item.id === tab)?.hint}</p>

      <div className="mt-8">
        {tab === "natal" ? (
          <NatalTab document={document} openPlanet={openPlanet} onToggle={setOpenPlanet} />
        ) : null}
        {tab === "cycles" ? (
          <CyclesTab document={document} filter={periodFilter} onFilter={setPeriodFilter} />
        ) : null}
        {tab === "request" ? <RequestTab document={document} /> : null}
        {tab === "summary" ? <SummaryTab document={document} /> : null}
      </div>

      {report.disclaimer ? (
        <p className="mt-14 text-sm leading-relaxed text-white/45">{report.disclaimer}</p>
      ) : null}
    </div>
  );
}

function NatalTab({
  document,
  openPlanet,
  onToggle,
}: {
  document: ReportDocument;
  openPlanet: string | null;
  onToggle: (key: string | null) => void;
}) {
  const points = document.factual?.natal?.points ?? [];
  const houses = document.factual?.natal?.houses ?? [];
  const core = points.filter((point) => CORE.includes(point.key as (typeof CORE)[number]));
  const rest = points.filter((point) => !CORE.includes(point.key as (typeof CORE)[number]));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Солнце, Луна, Асцендент</h2>
        <div className="mt-4 space-y-3">
          {core.map((point) => (
            <PlanetRow key={point.key} point={point} open={openPlanet === point.key} onToggle={onToggle} />
          ))}
        </div>
      </section>
      {rest.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Планеты в знаках</h2>
          <div className="mt-4 space-y-3">
            {rest.map((point) => (
              <PlanetRow key={point.key} point={point} open={openPlanet === point.key} onToggle={onToggle} />
            ))}
          </div>
        </section>
      ) : null}
      {houses.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Дома</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {houses.map((house) => (
              <div key={house.house} className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-[#F6E7A1]">
                  {house.house}-й · {house.sign_ru}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{house.theme}</p>
                {house.occupants?.length ? (
                  <p className="mt-2 text-xs text-white/40">{house.occupants.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type NatalPoint = {
  key: string;
  name: string;
  sign_ru: string;
  degree?: number;
  house?: number | null;
  fact: string;
  retrograde?: boolean;
  glyph?: string;
};

function PlanetRow({
  point,
  open,
  onToggle,
}: {
  point: NatalPoint;
  open: boolean;
  onToggle: (key: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(open ? null : point.key)}
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-[#F6E7A1]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-medium text-white">
          {point.glyph ? <span className="mr-2 text-[#F6E7A1]">{point.glyph}</span> : null}
          {point.name}
          <span className="ml-2 font-display italic text-[#F6E7A1]">
            {point.sign_ru}
            {point.house ? ` · дом ${point.house}` : ""}
          </span>
        </h3>
        <span className="text-sm text-white/40">{open ? "свернуть" : "открыть"}</span>
      </div>
      {open ? (
        <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{point.fact}</p>
      ) : (
        <p className="mt-2 text-sm text-white/45">
          {typeof point.degree === "number" ? `${point.degree}°` : ""}
          {point.retrograde ? " · ретроград" : ""}
        </p>
      )}
    </button>
  );
}

function CyclesTab({
  document,
  filter,
  onFilter,
}: {
  document: ReportDocument;
  filter: PolarityFilter;
  onFilter: (value: PolarityFilter) => void;
}) {
  const pressure = document.accents?.pressure ?? [];
  const resource = document.accents?.resource ?? [];
  const visible = useMemo(() => {
    if (filter === "pressure") return pressure;
    if (filter === "resource") return resource;
    const seen = new Set<string>();
    return [...pressure, ...resource].filter((hit) => {
      if (!hit.id || seen.has(hit.id)) return false;
      seen.add(hit.id);
      return true;
    });
  }, [filter, pressure, resource]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "все"],
            ["pressure", "напряжённые"],
            ["resource", "ресурсные"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilter(key)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === key ? "bg-[#F6E7A1] text-[#0a1a3a]" : "border border-white/15 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {visible.map((hit) => (
          <TransitCard key={hit.id} hit={hit} />
        ))}
        {visible.length === 0 ? (
          <p className="text-white/60">В текущем орбе нет персональных попаданий этого типа.</p>
        ) : null}
      </div>
    </div>
  );
}

function RequestTab({ document }: { document: ReportDocument }) {
  const quiz = document.quiz;
  const section = document.sections?.request;
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Из онбординга</p>
        <ul className="mt-4 space-y-2 text-[16px] leading-relaxed text-white/78">
          {quiz?.focus_labels?.length ? <li>волнует: {quiz.focus_labels.join(", ")}</li> : null}
          {quiz?.life_stage_label ? <li>сезон: {quiz.life_stage_label}</li> : null}
          {quiz?.intent_label ? <li>запрос: {quiz.intent_label}</li> : null}
          {quiz?.astrology_trigger_label ? (
            <li>к астрологии приходит, когда {quiz.astrology_trigger_label}</li>
          ) : null}
        </ul>
      </div>
      {(section?.blocks ?? []).map((block) => (
        <article key={block.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-display text-2xl italic text-[#F6E7A1]">{block.title}</h3>
          <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{block.text}</p>
        </article>
      ))}
    </div>
  );
}

function SummaryTab({ document }: { document: ReportDocument }) {
  const section = document.sections?.summary;
  const upcoming = document.accents?.upcoming ?? [];
  return (
    <div className="space-y-6">
      {(section?.blocks ?? []).map((block) => (
        <article key={block.title} className="rounded-3xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          <h3 className="font-display text-2xl italic text-[#F6E7A1]">{block.title}</h3>
          <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{block.text}</p>
        </article>
      ))}
      {upcoming.length > 0 ? (
        <section>
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">К точности</h3>
          <div className="mt-4 space-y-3">
            {upcoming.map((hit) => (
              <TransitCard key={hit.id} hit={hit} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TransitCard({
  hit,
  featured = false,
  compact = false,
}: {
  hit: ReportTransitHit;
  featured?: boolean;
  compact?: boolean;
}) {
  const polarity =
    hit.polarity === "resource" ? "ресурс" : hit.polarity === "mixed" ? "смешанное" : "напряжение";
  return (
    <article
      className={`rounded-3xl border p-5 ${
        featured ? "border-[#F6E7A1]/40 bg-white/5" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">{polarity}</p>
        {typeof hit.orb === "number" ? <p className="text-xs text-white/40">орб {hit.orb}°</p> : null}
        {hit.motion ? <p className="text-xs text-white/40">{hit.motion}</p> : null}
      </div>
      <h3 className="mt-2 text-lg font-medium leading-snug text-white">
        {hit.transit_name} {hit.aspect_ru} {hit.natal_name}
      </h3>
      {hit.fact ? <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{hit.fact}</p> : null}
      {compact ? null : (
        <>
          {hit.duration ? (
            <p className="mt-3 text-sm text-white/55">
              <span className="text-[#F6E7A1]">Длительность. </span>
              {hit.duration}
            </p>
          ) : null}
          {hit.meaning ? (
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              <span className="text-[#F6E7A1]">Что значит. </span>
              {hit.meaning}
            </p>
          ) : null}
          {hit.practice || hit.work_with ? (
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              <span className="text-[#F6E7A1]">Как работать. </span>
              {hit.practice || hit.work_with}
            </p>
          ) : null}
          {hit.use_for ? (
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              <span className="text-[#F6E7A1]">Для чего. </span>
              {hit.use_for}
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}

function LinearSections({ report }: { report: PaidReport }) {
  return (
    <div className="mt-12 space-y-12">
      {report.sections.map((section) => (
        <section key={section.id}>
          <h2 className="text-xs uppercase tracking-[0.18em] text-[#F6E7A1]">{section.title}</h2>
          <div className="mt-5 space-y-6">
            {section.blocks.map((block) => (
              <div key={`${section.id}-${block.title}`}>
                <h3 className="text-lg font-medium leading-snug">{block.title}</h3>
                <p className="mt-2 text-[16px] leading-[1.6] text-white/78">{block.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {report.disclaimer ? (
        <p className="text-sm leading-relaxed text-white/45">{report.disclaimer}</p>
      ) : null}
    </div>
  );
}
