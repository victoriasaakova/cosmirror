"use client";

import { useMemo, useState } from "react";
import type { PaidReport, ReportDocument, ReportTransitHit } from "@/lib/api";

type PolarityFilter = "all" | "pressure" | "resource";

export function InteractiveReport({ report }: { report: PaidReport }) {
  const document = report.document;
  const tabs = document?.presentation?.web?.tabs ?? [];
  const defaultTab = document?.presentation?.web?.default_tab || tabs[0]?.id || "now";
  const [tab, setTab] = useState(defaultTab);
  const [openPlanet, setOpenPlanet] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PolarityFilter>("all");

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
      <p className="mt-3 text-sm text-white/45">
        {tabs.find((item) => item.id === tab)?.hint}
      </p>

      <div className="mt-8">
        {tab === "now" ? <NowTab document={document} /> : null}
        {tab === "natal" ? (
          <NatalTab document={document} openPlanet={openPlanet} onToggle={setOpenPlanet} />
        ) : null}
        {tab === "periods" ? (
          <PeriodsTab document={document} filter={periodFilter} onFilter={setPeriodFilter} />
        ) : null}
        {tab === "request" ? <RequestTab document={document} /> : null}
        {tab === "practice" ? <PracticeTab document={document} /> : null}
        {tab === "method" ? <MethodTab document={document} /> : null}
      </div>

      {report.disclaimer ? (
        <p className="mt-14 text-sm leading-relaxed text-white/45">{report.disclaimer}</p>
      ) : null}
    </div>
  );
}

function NowTab({ document }: { document: ReportDocument }) {
  const line = document.accents?.through_line;
  const primary = document.accents?.primary?.[0];
  const supporting = document.accents?.supporting ?? [];
  return (
    <div className="space-y-6">
      {line ? (
        <article className="rounded-3xl border border-[#F6E7A1]/25 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Сквозная линия</p>
          <h2 className="mt-2 font-display text-2xl italic text-white">
            {line.transit_name}
            {line.natal_points?.length ? ` × ${line.natal_points.join(", ")}` : ""}
          </h2>
          <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{line.summary_fact}</p>
        </article>
      ) : null}
      {primary ? <TransitCard hit={primary} featured /> : null}
      {supporting.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Рядом с пиком</h3>
          {supporting.map((hit) => (
            <TransitCard key={hit.id} hit={hit} />
          ))}
        </div>
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
  const aspects = document.factual?.natal?.aspects ?? [];
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {points.map((point) => {
          const open = openPlanet === point.key;
          return (
            <button
              key={point.key}
              type="button"
              onClick={() => onToggle(open ? null : point.key)}
              className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-[#F6E7A1]/30"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium text-white">
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
        })}
      </div>
      {aspects.length > 0 ? (
        <section>
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Натальные аспекты</h3>
          <ul className="mt-4 space-y-3">
            {aspects.slice(0, 8).map((aspect) => (
              <li key={`${aspect.a_name}-${aspect.aspect_ru}-${aspect.b_name}`} className="text-[15px] leading-relaxed text-white/75">
                <span className="text-white">
                  {aspect.a_name} {aspect.aspect_ru} {aspect.b_name}
                </span>
                <span className="text-white/40"> · {aspect.orb}°</span>
                <span className="block text-white/55">{aspect.theme}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {houses.length > 0 ? (
        <section>
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Дома</h3>
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

function PeriodsTab({
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
            ["pressure", "напряжение"],
            ["resource", "ресурс"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilter(key)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === key
                ? "bg-[#F6E7A1] text-[#0a1a3a]"
                : "border border-white/15 text-white/70"
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
          {quiz?.astrology_trigger_label ? <li>к астрологии приходит, когда {quiz.astrology_trigger_label}</li> : null}
          {quiz?.chart_knowledge_label ? <li>знание карты: {quiz.chart_knowledge_label}</li> : null}
        </ul>
      </div>
      {(section?.blocks ?? []).map((block) => (
        <article key={block.title}>
          <h3 className="text-lg font-medium">{block.title}</h3>
          <p className="mt-2 text-[16px] leading-[1.65] text-white/78">{block.text}</p>
        </article>
      ))}
    </div>
  );
}

function PracticeTab({ document }: { document: ReportDocument }) {
  const section = document.sections?.practice;
  const questions = section?.questions ?? [];
  return (
    <div className="space-y-6">
      {(section?.blocks ?? []).map((block) => (
        <article key={block.title}>
          <h3 className="text-lg font-medium">{block.title}</h3>
          <p className="mt-2 text-[16px] leading-[1.65] text-white/78">{block.text}</p>
        </article>
      ))}
      {questions.length > 0 ? (
        <section>
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Вопросы</h3>
          <ol className="mt-4 space-y-4">
            {questions.map((question) => (
              <li key={question} className="rounded-2xl border border-white/10 p-4 text-[16px] leading-relaxed text-white/80">
                {question}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function MethodTab({ document }: { document: ReportDocument }) {
  const method = document.factual?.method;
  const collective = document.factual?.sky?.collective ?? [];
  return (
    <div className="space-y-6">
      <article>
        <h3 className="font-display text-2xl italic text-[#F6E7A1]">{method?.engine_label || "Расчёт"}</h3>
        <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{method?.what_it_means}</p>
      </article>
      {method?.what_calculated?.length ? (
        <ul className="space-y-2 text-[16px] leading-relaxed text-white/75">
          {method.what_calculated.map((item) => (
            <li key={item}>— {item}</li>
          ))}
        </ul>
      ) : null}
      {collective.length > 0 ? (
        <section>
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">Общий фон, не персональный</h3>
          <ul className="mt-4 space-y-3">
            {collective.map((row) => (
              <li key={row.name} className="text-[16px] leading-relaxed text-white/75">
                {row.name} в {row.sign_ru}: {row.theme}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {method?.notes?.length ? (
        <p className="text-sm leading-relaxed text-white/45">{method.notes.join(" ")}</p>
      ) : null}
      {document.interpretive?.status === "pending_llm" ? (
        <p className="text-sm leading-relaxed text-white/40">
          Интерпретационный слой пока каркас: тексты модели подключим отдельно, не меняя расчёт Swiss Ephemeris.
        </p>
      ) : null}
    </div>
  );
}

function TransitCard({ hit, featured = false }: { hit: ReportTransitHit; featured?: boolean }) {
  const polarity = hit.polarity === "resource" ? "ресурс" : hit.polarity === "mixed" ? "смешанное" : "напряжение";
  return (
    <article
      className={`rounded-3xl border p-5 ${
        featured ? "border-[#F6E7A1]/40 bg-white/5" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-[#F6E7A1]">{polarity}</p>
        {typeof hit.orb === "number" ? (
          <p className="text-xs text-white/40">орб {hit.orb}°</p>
        ) : null}
        {hit.motion ? <p className="text-xs text-white/40">{hit.motion}</p> : null}
      </div>
      <h3 className="mt-2 text-lg font-medium leading-snug text-white">
        {hit.transit_name} {hit.aspect_ru} {hit.natal_name}
      </h3>
      {hit.fact ? <p className="mt-3 text-[16px] leading-[1.65] text-white/78">{hit.fact}</p> : null}
      {hit.window?.span_note ? (
        <p className="mt-3 text-sm text-white/50">{hit.window.span_note}</p>
      ) : null}
      {hit.work_with ? (
        <p className="mt-3 text-sm leading-relaxed text-white/65">{hit.work_with}</p>
      ) : null}
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
