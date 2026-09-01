"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ReportOpening } from "@/components/ReportOpening";
import { SectionFeedbackCard } from "@/components/SectionFeedbackCard";
import { LockedReportSection } from "@/components/LockedReportSection";
import { ReportSectionPreloader } from "@/components/StarCheckPreloader";
import {
  aspectGlyph,
  astroPairLabel,
  formatDms,
  parseAstroPairId,
  planetGlyph,
  signGlyph,
  type AstroPair,
} from "@/lib/astro-glyphs";
import {
  isReportFeedbackSection,
  reportReadyToOpen,
  type CycleCard,
  type NatalAspectCard,
  type NatalFallbackTheme,
  type NatalInterpretationPayload,
  type NatalThemeSection,
  type PaidReport,
  type ReportBlock,
  type ReportDocument,
  type ReportTransitHit,
  type SectionFeedback,
} from "@/lib/api";

type AspectCategoryFilter = "all" | "tension" | "resource" | "mixed";
type CycleCategoryFilter = "all" | "tension" | "support" | "mixed";

const CORE = ["sun", "moon", "ascendant"] as const;

const FREE_LOCKED_SECTIONS = ["natal", "aspects", "cycles", "request", "practice"] as const;

function noopUnlock() {}

const REPORT_NAV = [
  { id: "home", label: "Главная", subtitle: "твоя натальная карта" },
  { id: "natal", label: "Твоя карта", subtitle: "расшифровка значений" },
  { id: "aspects", label: "Аспекты", subtitle: "как связаны темы в карте" },
  { id: "cycles", label: "Циклы", subtitle: "что актуально сейчас" },
  { id: "request", label: "Запрос", subtitle: "расшифровка запроса" },
  { id: "practice", label: "Практика", subtitle: "как работать с темами" },
] as const;

const NATAL_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Солнце, Луна, Асцендент", keys: ["sun", "moon", "ascendant"] },
  { title: "Как работает твой ум", keys: ["mercury"] },
  { title: "Близость и отношения", keys: ["venus"] },
  { title: "Воля, энергия и действие", keys: ["mars"] },
  { title: "Работа, реализация и вклад", keys: ["jupiter", "saturn", "midheaven"] },
  { title: "Где ещё звучит напряжение и глубина", keys: ["uranus", "neptune", "pluto"] },
];

const SECTION_BY_POINT: Record<string, string> = {
  mercury: "mind",
  venus: "relationships",
  mars: "action",
  jupiter: "work",
  saturn: "work",
  midheaven: "work",
};

type NatalPoint = {
  key: string;
  name: string;
  sign?: string;
  sign_ru: string;
  degree?: number;
  minute?: number;
  house?: number | null;
  fact: string;
  retrograde?: boolean;
  glyph?: string;
};

type NatalAspect = NonNullable<
  NonNullable<NonNullable<ReportDocument["factual"]>["natal"]>["aspects"]
>[number];

type WhyMark = {
  aspect?: string;
  aspect_ru?: string;
  planetKey?: string;
  planetName?: string;
  otherKey?: string;
  otherName?: string;
  pair?: boolean;
};

type PlacementCopy = {
  headline?: string;
  paragraphs: string[];
  question: string;
  houseModifier?: string;
  why?: string;
};

type Props = {
  report: PaidReport;
  displayName: string;
  orderId?: string;
  downloading: boolean;
  onDownloadPdf: () => void;
  actionNote?: string;
  sectionFeedback?: SectionFeedback[];
  access?: "free" | "paid";
  lockedSections?: string[];
  onUnlock?: () => void;
};

function isTakeawayBlock(block: ReportBlock): boolean {
  return block.kind === "user_takeaway" || block.title.trim() === "Твой вывод";
}

function scrollReportTop() {
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

function keepLlmLayers(prev: PaidReport | undefined, next: PaidReport): PaidReport {
  const interpretive = next.document?.interpretive;
  if (!interpretive || !prev?.document?.interpretive) return next;

  // Freeze previous LLM only while a generate job is in flight (avoids flicker).
  // When idle / done / LLM_PROVIDER=off — always trust the server payload
  // (live YAML semantic fallback, or sealed LLM).
  const generationStatus = interpretive.generation?.status;
  if (generationStatus !== "running") {
    return next;
  }

  const prevNatal = prev.document.interpretive.natal;
  const prevAspects = prev.document.interpretive.aspects;
  const prevCycles = prev.document.interpretive.cycles;
  const prevRequest = prev.document.interpretive.request;
  const prevPractice = prev.document.interpretive.practice;
  return {
    ...next,
    document: {
      ...next.document,
      interpretive: {
        ...interpretive,
        natal:
          prevNatal?.source === "llm" && interpretive.natal?.source !== "llm"
            ? prevNatal
            : interpretive.natal,
        aspects:
          prevAspects?.source === "llm" && interpretive.aspects?.source !== "llm"
            ? prevAspects
            : interpretive.aspects,
        cycles:
          prevCycles?.source === "llm" && interpretive.cycles?.source !== "llm"
            ? prevCycles
            : interpretive.cycles,
        request:
          prevRequest?.source === "llm" && interpretive.request?.source !== "llm"
            ? prevRequest
            : interpretive.request,
        practice:
          prevPractice?.source === "llm" && interpretive.practice?.source !== "llm"
            ? prevPractice
            : interpretive.practice,
      },
    },
  };
}

function layerAwaitingLlm(
  layer?: { source?: string; can_generate?: boolean; payload?: unknown },
  generationStatus?: string,
): boolean {
  if (layer?.source === "llm") return false;
  if (!layer?.can_generate) return false;
  if (generationStatus === "done") return false;
  return true;
}

export function InteractiveReport({
  report,
  displayName,
  orderId,
  downloading,
  onDownloadPdf,
  actionNote,
  sectionFeedback,
  access = "paid",
  lockedSections = [],
  onUnlock,
}: Props) {
  const [live, setLive] = useState(report);
  const [tab, setTab] = useState("home");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedbackRows, setFeedbackRows] = useState<SectionFeedback[]>(sectionFeedback ?? []);

  useEffect(() => {
    setLive((prev) => keepLlmLayers(prev, report));
  }, [report]);

  useEffect(() => {
    setFeedbackRows((prev) => {
      const bySection = new Map(prev.map((row) => [row.section, row]));
      for (const row of sectionFeedback ?? []) {
        if (!bySection.has(row.section)) bySection.set(row.section, row);
      }
      return [...bySection.values()];
    });
  }, [sectionFeedback]);

  const document = live.document;
  const sectionTabs = document?.presentation?.web?.tabs ?? [];
  const tabs = REPORT_NAV.map((item) => ({ ...item }));

  const isFree = access === "free";
  const locked = new Set<string>(
    isFree ? FREE_LOCKED_SECTIONS : lockedSections,
  );
  const unlock = onUnlock ?? noopUnlock;
  const lockedTab = tab !== "home" && locked.has(tab);

  useEffect(() => {
    if (!lockedTab) return;
    window.document.documentElement.classList.add("report-lock-scroll");
    return () => {
      window.document.documentElement.classList.remove("report-lock-scroll");
    };
  }, [lockedTab]);

  function openSection(id: string, itemKey?: string) {
    setTab(id);
    if (itemKey?.startsWith("filter:")) {
      setCategoryFilter(itemKey.slice("filter:".length));
      setFocusKey(null);
      scrollReportTop();
      return;
    }
    setCategoryFilter("all");
    setFocusKey(itemKey ?? null);
    scrollReportTop();
  }
  const generationStatus = document?.interpretive?.generation?.status;
  const generatingNatal = layerAwaitingLlm(document?.interpretive?.natal, generationStatus);
  const generatingAspects = layerAwaitingLlm(document?.interpretive?.aspects, generationStatus);
  const generatingCycles = layerAwaitingLlm(document?.interpretive?.cycles, generationStatus);
  const generatingRequest = layerAwaitingLlm(document?.interpretive?.request, generationStatus);
  const generatingPractice = layerAwaitingLlm(document?.interpretive?.practice, generationStatus);
  const tabGenerating =
    !isFree &&
    ((tab === "natal" && generatingNatal) ||
      (tab === "aspects" && generatingAspects) ||
      (tab === "cycles" && generatingCycles) ||
      (tab === "request" && generatingRequest) ||
      (tab === "practice" && generatingPractice));

  const opening = (
    <ReportOpening
      report={live}
      displayName={displayName}
      orderId={orderId}
      downloading={downloading}
      onDownloadPdf={onDownloadPdf}
      actionNote={actionNote}
      hideShareActions={isFree || !reportReadyToOpen(live)}
    />
  );

  if (!document || (sectionTabs.length === 0 && !isFree)) {
    return (
      <div className="min-w-0 pb-8 lg:pb-16">
        {opening}
        <LinearSections report={live} />
      </div>
    );
  }

  const activeNav = tabs.find((item) => item.id === tab);

  return (
    <div
      className={
        lockedTab
          ? "min-w-0 pb-8 lg:grid lg:grid-cols-[15.5rem_minmax(0,45rem)] lg:items-stretch lg:gap-10 lg:pb-16 xl:gap-14"
          : "min-w-0 pb-8 lg:grid lg:grid-cols-[15.5rem_minmax(0,45rem)] lg:items-start lg:gap-10 lg:pb-16 xl:gap-14"
      }
    >
      <nav
        aria-label="Разделы отчёта"
        className={
          lockedTab
            ? "hidden lg:flex lg:flex-col lg:gap-1.5 lg:self-stretch"
            : "hidden lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100dvh-7.5rem)] lg:flex-col lg:gap-1.5 lg:self-start"
        }
      >
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => openSection(item.id)}
              className={`rounded-2xl border px-4 py-2.5 text-left transition duration-200 ease-out active:scale-[0.99] ${
                active
                  ? "border-[#F6E7A1]/45 bg-white/[0.06]"
                  : "border-white/12 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`block font-display text-[18px] italic font-normal leading-[1.2] tracking-tight ${
                  active ? "text-[#F6E7A1]" : "text-white"
                }`}
              >
                {item.label}
              </span>
              <span className="mt-0.5 block text-sm font-normal leading-snug text-[color:var(--muted)]">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </nav>

      <div className={lockedTab ? "flex min-h-0 min-w-0 flex-col lg:h-full" : "min-w-0"}>
        {tab === "home" ? (
          <>
            {opening}
            <MobileSectionCatalog onOpen={openSection} />
          </>
        ) : null}

        {tab !== "home" && activeNav ? (
          <div className={lockedTab ? "mb-3 lg:mb-3" : "mb-8 lg:mb-6"}>
            <button
              type="button"
              onClick={() => openSection("home")}
              className="mb-4 inline-flex min-h-11 items-center gap-2 text-base text-[#F6E7A1] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              К разделам
            </button>
            <h1 className="report-section-title pb-1">{activeNav.label}</h1>
          </div>
        ) : null}

        {tab !== "home" ? (
          <div className={locked.has(tab) ? "flex min-h-0 flex-1 flex-col" : undefined}>
            {locked.has(tab) ? (
              <LockedReportSection section={tab} onUnlock={unlock} />
            ) : tabGenerating ? (
              <ReportSectionPreloader />
            ) : (
              <>
                {tab === "natal" ? (
                  <NatalTab document={document} focusKey={focusKey} />
                ) : null}
                {tab === "aspects" ? (
                  <AspectsTab document={document} focusKey={focusKey} initialFilter={categoryFilter} />
                ) : null}
                {tab === "cycles" ? (
                  <CyclesTab document={document} focusKey={focusKey} initialFilter={categoryFilter} />
                ) : null}
                {tab === "request" ? <RequestTab document={document} /> : null}
                {tab === "practice" ? <PracticeTab document={document} /> : null}
                {isReportFeedbackSection(tab) ? (
                  <SectionFeedbackCard
                    section={tab}
                    initial={feedbackRows.find((row) => row.section === tab) ?? null}
                    onSaved={(saved) => {
                      setFeedbackRows((prev) => [
                        ...prev.filter((row) => row.section !== saved.section),
                        saved,
                      ]);
                    }}
                  />
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {live.disclaimer && !lockedTab && !tabGenerating ? (
          <p className="report-lede mt-14">{live.disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}

function MobileSectionCatalog({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const rows = REPORT_NAV.filter((item) => item.id !== "home");
  return (
    <nav aria-label="Разделы отчёта" className="mt-12 space-y-3 lg:hidden">
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={() => onOpen(row.id)}
          className="flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-left transition active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block text-[1.45rem] leading-[1.15] tracking-tight text-white">{row.label}</span>
            <span className="mt-1 block text-sm font-normal leading-snug text-[color:var(--muted)]">
              {row.subtitle}
            </span>
          </span>
          <span className="shrink-0 font-display text-2xl italic leading-none text-[#F6E7A1]" aria-hidden>
            ›
          </span>
        </button>
      ))}
    </nav>
  );
}

function NatalTab({ document, focusKey }: { document: ReportDocument; focusKey?: string | null }) {
  const [openPlanet, setOpenPlanet] = useState<string | null>(focusKey ?? null);
  useEffect(() => {
    if (focusKey) setOpenPlanet(focusKey);
  }, [focusKey]);
  const natal = document.interpretive?.natal?.payload;
  const usingLibrary = Boolean(natal?.placements?.length);
  const portrait = natal?.core_portrait;
  const points = document.factual?.natal?.points ?? [];
  const houses = document.factual?.natal?.houses ?? [];
  const byKey = new Map(points.map((point) => [point.key, point]));
  // Structure is fixed; fallback/LLM only swap card copy via placementCopy().
  const grouped = NATAL_GROUPS.map((group) => ({
    ...group,
    items: group.keys
      .map((key) => byKey.get(key))
      .filter((point): point is NatalPoint => Boolean(point)),
  })).filter((group) => group.items.length > 0);
  const groupedKeys = new Set(NATAL_GROUPS.flatMap((group) => group.keys));
  const leftover = points.filter(
    (point) =>
      !CORE.includes(point.key as (typeof CORE)[number]) && !groupedKeys.has(point.key),
  );
  const extraSections = usingLibrary
    ? []
    : (natal?.sections ?? []).filter((section) =>
        ["inner_conflict", "resource", "flexibility"].includes(section.id || ""),
      );
  const aspects = document.factual?.natal?.aspects ?? [];
  const glyphByKey = new Map(points.map((point) => [point.key, point.glyph || ""]));
  const coreThemes = portrait?.themes ?? [];
  const repeatingThemes = natal?.repeating_themes ?? [];
  const questions = usingLibrary ? natal?.reflection_questions ?? [] : [];
  const limitations = natal?.limitations ?? [];

  return (
    <div className="space-y-10">
      {usingLibrary && coreThemes.length > 0 ? (
        <section className="space-y-6">
          {coreThemes.map((theme) => (
            <ThemeBlock key={theme.theme_id || theme.headline} theme={theme} />
          ))}
        </section>
      ) : portrait?.headline || portrait?.summary ? (
        <section>
          {portrait.headline ? (
            <h2 className="report-theme-title pb-1">
              {portrait.headline}
            </h2>
          ) : null}
          {portrait.summary ? (
            <p className={`report-lede ${portrait.headline ? "mt-3" : ""}`}>
              {portrait.summary}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="report-lede">
          Это гипотезы по уже посчитанной карте. Узнаёшь - бери. Не узнаёшь - это тоже ответ.
        </p>
      )}
      {grouped.map((group) => (
        <section key={group.title}>
          <h2 className="report-group-title pb-1">{group.title}</h2>
          <div className="mt-6 space-y-3">
            {group.items.map((point) => (
              <PlanetRow
                key={point.key}
                point={point}
                copy={placementCopy(point, natal)}
                marks={marksForPoint(point.key, aspects)}
                glyphByKey={glyphByKey}
                open={openPlanet === point.key}
                onToggle={setOpenPlanet}
              />
            ))}
          </div>
        </section>
      ))}
      {leftover.length > 0 ? (
        <section>
          <h2 className="report-group-title pb-1">Что ещё звучит в карте</h2>
          <div className="mt-6 space-y-3">
            {leftover.map((point) => (
              <PlanetRow
                key={point.key}
                point={point}
                copy={placementCopy(point, natal)}
                marks={marksForPoint(point.key, aspects)}
                glyphByKey={glyphByKey}
                open={openPlanet === point.key}
                onToggle={setOpenPlanet}
              />
            ))}
          </div>
        </section>
      ) : null}
      {extraSections.map((section) => (
        <section key={section.id || section.title}>
          <h2 className="report-group-title pb-1">{section.title}</h2>
          <div className="mt-4">
            <PlanetRow
              point={{
                key: `section-${section.id}`,
                name: section.headline || section.title || "",
                sign_ru: "",
                fact: "",
              }}
              copy={sectionCopy(section)}
              marks={marksForSection(section.id || "", aspects)}
              glyphByKey={glyphByKey}
              open={openPlanet === `section-${section.id}`}
              onToggle={setOpenPlanet}
            />
          </div>
        </section>
      ))}
      {repeatingThemes.length > 0 ? (
        <section>
          <h2 className="report-group-title pb-1">Что повторяется</h2>
          <div className="mt-4 space-y-6">
            {repeatingThemes.map((theme) => (
              <ThemeBlock key={theme.theme_id || theme.headline} theme={theme} />
            ))}
          </div>
        </section>
      ) : null}
      {questions.length > 0 ? (
        <section>
          <h2 className="report-group-title pb-1">Для наблюдения</h2>
          <div className="mt-4 space-y-3">
            {questions.map((question) => (
              <p key={question} className="report-quote">
                {question}
              </p>
            ))}
          </div>
        </section>
      ) : null}
      {limitations.length > 0 ? (
        <p className="report-lede">{limitations.join(" ")}</p>
      ) : null}
      {houses.length > 0 ? (
        <section>
          <h2 className="report-group-title pb-1">Где это может проявляться</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {houses.map((house) => {
              const glyph = signGlyph(house.sign);
              return (
                <div key={house.house} className="rounded-2xl border border-white/10 p-4">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-base text-[#F6E7A1]">
                    <span>{house.house}-й дом</span>
                    <span className="text-white/35">·</span>
                    {glyph ? (
                      <span className="natal-astro-glyph text-base leading-none" aria-hidden>
                        {glyph}
                      </span>
                    ) : null}
                    <span>{house.sign_ru}</span>
                  </p>
                  <p className="report-prose mt-2">{house.theme}</p>
                  {house.occupants?.length ? (
                    <p className="mt-2 text-base text-[color:var(--muted)]">{house.occupants.join(", ")}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ThemeBlock({ theme }: { theme: NatalFallbackTheme }) {
  return (
    <div>
      {theme.headline ? (
        <h2 className="report-theme-title pb-1">
          {theme.headline}
        </h2>
      ) : null}
      {theme.narrative ? (
        <p className={`report-lede ${theme.headline ? "mt-3" : ""}`}>{theme.narrative}</p>
      ) : null}
      {theme.reflection_question ? (
        <p className="report-quote">{theme.reflection_question}</p>
      ) : null}
    </div>
  );
}

function placementCopy(point: NatalPoint, natal?: NatalInterpretationPayload): PlacementCopy {
  const libraryCard = natal?.placements?.find((row) => row.point_key === point.key);
  if (libraryCard) {
    const paragraphs = (
      libraryCard.paragraphs?.length
        ? libraryCard.paragraphs
        : [libraryCard.summary, ...(libraryCard.deep_read ?? [])]
    ).filter((item): item is string => Boolean(item));
    return {
      headline: libraryCard.headline || "",
      paragraphs,
      question: "",
      houseModifier: libraryCard.house_modifier || "",
      why: libraryCard.astro_explanation || "",
    };
  }
  if (point.key === "sun" || point.key === "moon" || point.key === "ascendant") {
    const card = natal?.big_three?.[point.key];
    if (card?.body) {
      return { paragraphs: [card.body], question: card.question || "" };
    }
  }
  const sectionId = SECTION_BY_POINT[point.key];
  if (sectionId && sectionId !== "work") {
    const fromSection = sectionCopy(natal?.sections?.find((row) => row.id === sectionId));
    if (fromSection.paragraphs.length) return fromSection;
  }
  if (point.key === "saturn") {
    const fromWork = sectionCopy(natal?.sections?.find((row) => row.id === "work"));
    if (fromWork.paragraphs.length) return fromWork;
  }
  return { paragraphs: point.fact ? [point.fact] : [], question: "" };
}

function sectionCopy(section?: NatalThemeSection): PlacementCopy {
  if (!section) return { paragraphs: [], question: "" };
  return {
    paragraphs: [section.summary || "", ...(section.deep_read ?? [])].filter(Boolean),
    question: section.question || "",
  };
}

function marksForPoint(key: string, aspects: NatalAspect[]): WhyMark[] {
  return aspects
    .filter((row) => row.a === key || row.b === key)
    .slice()
    .sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99))
    .slice(0, 6)
    .map((row) => {
      const otherKey = row.a === key ? row.b : row.a;
      const otherName = row.a === key ? row.b_name : row.a_name;
      return {
        aspect: row.aspect,
        aspect_ru: row.aspect_ru,
        planetKey: otherKey,
        planetName: otherName,
      };
    });
}

function marksForSection(id: string, aspects: NatalAspect[]): WhyMark[] {
  let rows = aspects;
  if (id === "resource") rows = aspects.filter((row) => row.kind === "soft");
  else if (id === "flexibility") rows = aspects.filter((row) => row.kind === "hard");
  else if (id === "inner_conflict") {
    const sunMoon = aspects.filter(
      (row) =>
        (row.a === "sun" && row.b === "moon") || (row.a === "moon" && row.b === "sun"),
    );
    rows = sunMoon.length
      ? sunMoon
      : aspects.filter(
          (row) =>
            row.kind === "hard" &&
            (row.a === "sun" || row.b === "sun" || row.a === "moon" || row.b === "moon"),
        );
  }
  return rows.slice(0, 6).map((row) => ({
    aspect: row.aspect,
    aspect_ru: row.aspect_ru,
    planetKey: row.a,
    planetName: row.a_name,
    otherKey: row.b,
    otherName: row.b_name,
    pair: true,
  }));
}

function ChevronToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Свернуть" : "Открыть"}
      className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#F6E7A1] transition-transform duration-200 ease-out active:scale-[0.97]"
    >
      <svg
        viewBox="0 0 20 20"
        className={`h-5 w-5 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function PlanetRow({
  point,
  copy,
  marks,
  glyphByKey,
  open,
  onToggle,
}: {
  point: NatalPoint;
  copy: PlacementCopy;
  marks: WhyMark[];
  glyphByKey: Map<string, string>;
  open: boolean;
  onToggle: (key: string | null) => void;
}) {
  const glyph = signGlyph(point.sign);
  const dms = formatDms(point.degree, point.minute);
  return (
    <article className="select-text rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-medium text-white">
          {point.glyph ? <span className="mr-2 text-[#F6E7A1]">{point.glyph}</span> : null}
          {point.name}
          {point.sign_ru ? (
            <span className="ml-2 inline-flex flex-wrap items-baseline gap-x-2 font-display italic text-[#F6E7A1]">
              {glyph ? (
                <span className="natal-astro-glyph text-base font-normal not-italic leading-none" aria-hidden>
                  {glyph}
                </span>
              ) : null}
              <span>{point.sign_ru}</span>
              {point.house ? <span>· дом {point.house}</span> : null}
            </span>
          ) : null}
        </h3>
        <ChevronToggle open={open} onToggle={() => onToggle(open ? null : point.key)} />
      </div>
      {open ? (
        <div className="mt-3 space-y-3">
          {copy.headline ? (
            <p className="report-theme-title">{copy.headline}</p>
          ) : null}
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 72)} className="report-prose">
              {paragraph}
            </p>
          ))}
          {copy.houseModifier ? (
            <p className="report-prose">{copy.houseModifier}</p>
          ) : null}
          {copy.why ? <p className="report-lede">{copy.why}</p> : null}
          {copy.question ? (
            <div className="mt-8">
              <p className="report-theme-title pb-1">
                зона для исследования
              </p>
              <p className="report-quote">{copy.question}</p>
            </div>
          ) : null}
          {marks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Почему мы это видим">
              {marks.map((mark, index) => {
                const aspect = aspectGlyph(mark.aspect);
                const left = planetGlyph(mark.planetKey, glyphByKey.get(mark.planetKey || ""));
                const right = mark.pair
                  ? planetGlyph(mark.otherKey, glyphByKey.get(mark.otherKey || ""))
                  : "";
                const label = mark.pair
                  ? `${mark.planetName} ${mark.aspect_ru} ${mark.otherName}`
                  : `${mark.aspect_ru} ${mark.planetName}`;
                return (
                  <span
                    key={`${mark.aspect}-${mark.planetKey}-${mark.otherKey || ""}-${index}`}
                    className="inline-flex items-baseline gap-1.5 text-white/45"
                  >
                    <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-base leading-none text-[#F6E7A1]">
                      {mark.pair && left ? <span>{left}</span> : null}
                      {aspect ? <span>{aspect}</span> : null}
                      {mark.pair ? (right ? <span>{right}</span> : null) : left ? <span>{left}</span> : null}
                    </span>
                    <span className="text-base leading-snug">{label}</span>
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-base text-[color:var(--muted)]">
          {dms}
          {point.retrograde ? " · ретроград" : ""}
        </p>
      )}
    </article>
  );
}

function AspectsTab({
  document,
  focusKey,
  initialFilter,
}: {
  document: ReportDocument;
  focusKey?: string | null;
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState<AspectCategoryFilter>(asAspectFilter(initialFilter));
  const [openKey, setOpenKey] = useState<string | null>(focusKey ?? null);
  useEffect(() => {
    if (focusKey) setOpenKey(focusKey);
  }, [focusKey]);
  useEffect(() => {
    setFilter(asAspectFilter(initialFilter));
  }, [initialFilter]);
  const payload = document.interpretive?.aspects?.payload;
  const intro = payload?.intro;
  const themes = payload?.themes ?? [];
  const extraThemes =
    intro?.headline && themes[0]?.headline === intro.headline ? themes.slice(1) : themes;
  const cards = payload?.aspects ?? [];
  const factual = document.factual?.natal?.aspects ?? [];
  const glyphByKey = new Map(
    (document.factual?.natal?.points ?? []).map((point) => [point.key, point.glyph || ""]),
  );
  const visible = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((row) => row.category === filter);
  }, [cards, filter]);

  return (
    <div>
      {intro?.headline ? (
        <h2 className="report-theme-title pb-1">
          {intro.headline}
        </h2>
      ) : null}
      <p className={`report-lede ${intro?.headline ? "mt-3" : ""}`}>
        {intro?.summary ||
          "Это связи внутри карты, не текущее небо. Аспект показывает, как две темы уже сцеплены: трение, поддержка, растяжка или слияние."}
      </p>
      {extraThemes.length > 0 ? (
        <section className="mt-8 space-y-6">
          <h2 className="report-group-title pb-1">Что повторяется</h2>
          {extraThemes.map((theme) => (
            <ThemeBlock key={theme.theme_id || theme.headline} theme={theme} />
          ))}
        </section>
      ) : null}
      <div className="-mx-1 mt-8 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["all", "все"],
            ["tension", "напряжение"],
            ["resource", "ресурс"],
            ["mixed", "смешанное"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className="report-chip shrink-0"
            data-active={filter === key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {visible.map((card, index) => {
          const key = card.aspect_id || `${card.a}-${card.aspect}-${card.b}-${index}`;
          return (
            <AspectRow
              key={key}
              card={card}
              glyphByKey={glyphByKey}
              open={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
            />
          );
        })}
        {cards.length === 0 && factual.length === 0 ? (
          <p className="report-lede">В этом срезе тесных натальных аспектов нет.</p>
        ) : null}
        {cards.length > 0 && visible.length === 0 ? (
          <p className="report-lede">В этом срезе таких аспектов нет.</p>
        ) : null}
      </div>
    </div>
  );
}

function asAspectFilter(value?: string): AspectCategoryFilter {
  if (value === "tension" || value === "resource" || value === "mixed") return value;
  return "all";
}

function asCycleFilter(value?: string): CycleCategoryFilter {
  if (value === "tension" || value === "support" || value === "mixed") return value;
  return "all";
}

function categoryLabel(category?: string): string {
  if (category === "tension") return "напряжение";
  if (category === "resource") return "ресурс";
  if (category === "mixed") return "смешанное";
  return "";
}

function deepReadParagraphs(deep: string | string[] | undefined): string[] {
  if (Array.isArray(deep)) {
    return deep.map((item) => item.trim()).filter(Boolean);
  }
  return deep?.trim() ? [deep.trim()] : [];
}

function sameCopy(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();
}

function withoutContained(body: string, fragment: string): string {
  const fragmentText = fragment.trim();
  if (!fragmentText || !body) return body;
  if (!body.includes(fragmentText)) return body;
  return body.replace(fragmentText, "").replace(/\s{2,}/g, " ").trim();
}

function visibleManifestations(
  items: string[] | undefined,
  deepRead: string | string[] | undefined,
): string[] {
  const deepText = deepReadParagraphs(deepRead).join("\n");
  const seen = new Set<string>();
  const visible: string[] = [];
  for (const raw of items ?? []) {
    const item = raw.trim();
    if (!item || seen.has(item) || deepText.includes(item)) continue;
    seen.add(item);
    visible.push(item);
    if (visible.length >= 3) break;
  }
  return visible;
}

function ManifestationsBlock({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="report-theme-title pb-1">Как это может проявляться</p>
      <ul className="mt-2 list-disc space-y-2 pl-5">
        {items.map((item) => (
          <li key={item.slice(0, 80)} className="report-prose">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AspectRow({
  card,
  glyphByKey,
  open,
  onToggle,
}: {
  card: NatalAspectCard;
  glyphByKey: Map<string, string>;
  open: boolean;
  onToggle: () => void;
}) {
  const aGlyph = planetGlyph(card.a, glyphByKey.get(card.a || ""));
  const bGlyph = planetGlyph(card.b, glyphByKey.get(card.b || ""));
  const aspect = aspectGlyph(card.aspect);
  const tension = card.tension_or_blind_spot || card.blind_spot || "";
  const work = card.how_to_work || card.flexibility || "";
  const lead = [card.summary || "", ...(card.deep_read ?? [])].filter(Boolean);
  const rest = [card.resource || "", tension, work].filter(Boolean);
  const manifestations = visibleManifestations(
    card.possible_manifestations,
    card.deep_read,
  );
  const questions = card.reflection_questions ?? [];
  const pairLabel = `${card.a_name} ${card.aspect_ru} ${card.b_name}`;
  const headline = (card.headline || "").trim();
  const showHeadline = Boolean(headline && !sameCopy(headline, pairLabel));

  return (
    <article className="select-text rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-tight text-[#F6E7A1]">
            {categoryLabel(card.category)}
            {typeof card.orb_deg === "number" ? (
              <span className="ml-2 tracking-normal text-[color:var(--muted)]">орб {card.orb_deg}°</span>
            ) : null}
          </p>
          <h3 className="mt-2 break-words text-base font-normal leading-snug text-white">
            <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
              {aGlyph ? <span>{aGlyph}</span> : null}
              {aspect ? <span>{aspect}</span> : null}
              {bGlyph ? <span>{bGlyph}</span> : null}
            </span>
            <span className="ml-2">{pairLabel}</span>
          </h3>
          {showHeadline ? (
            <p className="mt-2 text-base font-normal leading-snug text-white">{headline}</p>
          ) : null}
        </div>
        <ChevronToggle open={open} onToggle={onToggle} />
      </div>
      {open ? (
        <div className="mt-4 space-y-3">
          {lead.map((paragraph) => (
            <p key={paragraph.slice(0, 80)} className="report-prose">
              {paragraph}
            </p>
          ))}
          <ManifestationsBlock items={manifestations} />
          {rest.map((paragraph) => (
            <p key={paragraph.slice(0, 80)} className="report-prose">
              {paragraph}
            </p>
          ))}
          {questions.length > 0 ? (
            <div className="mt-8">
              <p className="report-theme-title pb-1">
                зона для исследования
              </p>
              {questions.map((question) => (
                <p key={question.slice(0, 80)} className="report-quote">
                  {question}
                </p>
              ))}
            </div>
          ) : null}
          {card.astro_explanation ? (
            <p className="mt-4 report-lede">{card.astro_explanation}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Почему мы это видим">
            <span className="inline-flex items-baseline gap-1.5 text-white/45">
              <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-base leading-none text-[#F6E7A1]">
                {aGlyph ? <span>{aGlyph}</span> : null}
                {aspect ? <span>{aspect}</span> : null}
                {bGlyph ? <span>{bGlyph}</span> : null}
              </span>
              <span className="text-base leading-snug">{pairLabel}</span>
            </span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function isCompactCycle(card: CycleCard): boolean {
  if (card.source === "llm" || card.source === "semantic_fallback") return false;
  if (card.source === "factual_fallback" || card.source === "fallback") return true;
  const deep = Array.isArray(card.deep_read) ? card.deep_read : card.deep_read ? [card.deep_read] : [];
  return !(card.resource || card.protective_function || card.protective_hypothesis || deep.length > 1);
}

function CyclesTab({
  document,
  focusKey,
  initialFilter,
}: {
  document: ReportDocument;
  focusKey?: string | null;
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState<CycleCategoryFilter>(asCycleFilter(initialFilter));
  const [openKey, setOpenKey] = useState<string | null>(focusKey ?? null);
  useEffect(() => {
    if (focusKey) setOpenKey(focusKey);
  }, [focusKey]);
  useEffect(() => {
    setFilter(asCycleFilter(initialFilter));
  }, [initialFilter]);
  const layer = document.interpretive?.cycles;
  const payload = layer?.payload;
  const layerSource = layer?.source;
  const overview = payload?.period_overview;
  const cards = [...(payload?.primary_cycles ?? []), ...(payload?.secondary_cycles ?? [])];
  const synthesis = payload?.cross_cycle_synthesis;
  const richContent = cards.some((card) => !isCompactCycle(card));
  const degraded = layerSource !== "llm" && !richContent;
  const glyphByKey = new Map(
    (document.factual?.natal?.points ?? []).map((point) => [point.key, point.glyph || ""]),
  );
  const visible = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((row) => row.category === filter);
  }, [cards, filter]);

  return (
    <div>
      {overview?.headline ? (
        <h2 className="report-theme-title pb-1">
          {overview.headline}
        </h2>
      ) : null}
      <p className={`report-lede ${overview?.headline ? "mt-3" : ""}`}>
        {overview?.summary ||
          "Это внешнее небо к уже посчитанной карте. Не путать с натальными аспектами: те во вкладке «Аспекты»."}
      </p>
      {degraded ? (
        <p className="report-lede mt-3">
          Показан расчётный слой: какие циклы активны сейчас. Подробная интерпретация
          появится после генерации.
        </p>
      ) : null}
      <div className="-mx-1 mt-8 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["all", "все"],
            ["tension", "напряжение"],
            ["support", "ресурс"],
            ["mixed", "смешанное"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className="report-chip shrink-0"
            data-active={filter === key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {visible.map((card, index) => {
          const key = card.cycle_id || `${card.transit}-${card.aspect}-${card.natal}-${index}`;
          return (
            <CycleRow
              key={key}
              card={card}
              glyphByKey={glyphByKey}
              compact={isCompactCycle(card)}
              open={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
            />
          );
        })}
        {cards.length === 0 ? (
          <p className="report-lede">В текущем орбе нет персональных попаданий.</p>
        ) : null}
        {cards.length > 0 && visible.length === 0 ? (
          <p className="report-lede">В этом срезе таких циклов нет.</p>
        ) : null}
      </div>
      {synthesis?.narrative ? (
        <article className="mt-8 rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          <h3 className="report-theme-title pb-1">
            {synthesis.headline ||
              (degraded ? "Какие точки карты затронуты" : "Как эти периоды встречаются")}
          </h3>
          <p className="mt-3 report-prose">{synthesis.narrative}</p>
          {(synthesis.reflection_questions ?? []).length > 0 ? (
            <div className="mt-8">
              <p className="report-theme-title pb-1">
                зона для исследования
              </p>
              {synthesis.reflection_questions?.map((question) => (
                <p key={question.slice(0, 80)} className="report-quote">
                  {question}
                </p>
              ))}
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

function cycleCategoryLabel(category?: string): string {
  if (category === "tension") return "напряжение";
  if (category === "support") return "ресурс";
  if (category === "mixed") return "смешанное";
  return "";
}

function CycleRow({
  card,
  glyphByKey,
  compact,
  open,
  onToggle,
}: {
  card: CycleCard;
  glyphByKey: Map<string, string>;
  compact: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const tGlyph = planetGlyph(card.transit, "");
  const nGlyph = planetGlyph(card.natal, glyphByKey.get(card.natal || ""));
  const aspect = aspectGlyph(card.aspect);
  const pairLabel = card.technical_title || `${card.transit_name} ${card.aspect_ru} ${card.natal_name}`;
  const theme = (card.human_theme || card.headline || "").trim();
  const showTheme = Boolean(theme && !sameCopy(theme, pairLabel));
  const orb = card.timing?.orb_deg;
  const phase = card.timing?.phase;
  const windowText = (card.timing?.active_window_text || "").trim();
  const explanation = withoutContained(
    card.short_explanation || card.summary || "",
    windowText,
  );
  const fallbackQuestion = card.reflection_question || card.reflection_questions?.[0] || "";

  const deep = deepReadParagraphs(card.deep_read);
  const lead = [card.summary || "", ...deep].filter(Boolean);
  const rest = [
    card.personalization || "",
    card.protective_function || card.protective_hypothesis || "",
    card.resource || "",
    card.tension_or_blind_spot || "",
    card.how_to_work || card.flexibility || "",
  ].filter(Boolean);
  const manifestations = visibleManifestations(
    card.possible_manifestations,
    card.deep_read,
  );
  const generatedQuestions = card.reflection_questions ?? [];
  const whyText = card.astro_explanation || card.astrology_explanation || "";

  return (
    <article
      className="select-text rounded-2xl border border-white/10 bg-white/5 p-5"
      data-cycle-mode={compact ? "fallback" : "generated"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-tight text-[#F6E7A1]">
            {cycleCategoryLabel(card.category)}
            {typeof orb === "number" ? (
              <span className="ml-2 tracking-normal text-[color:var(--muted)]">орб {orb}°</span>
            ) : null}
            {phase ? <span className="ml-2 tracking-normal text-[color:var(--muted)]">{phase}</span> : null}
          </p>
          <h3 className="mt-2 break-words text-base font-normal leading-snug text-white">
            <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
              {tGlyph ? <span>{tGlyph}</span> : null}
              {aspect ? <span>{aspect}</span> : null}
              {nGlyph ? <span>{nGlyph}</span> : null}
            </span>
            <span className="ml-2">{pairLabel}</span>
          </h3>
          {showTheme ? (
            <p className="mt-2 text-base font-normal leading-snug text-white">{theme}</p>
          ) : null}
        </div>
        <ChevronToggle open={open} onToggle={onToggle} />
      </div>
      {open ? (
        compact ? (
          <div className="mt-4 space-y-3">
            {windowText ? (
              <p className="report-lede">{windowText}</p>
            ) : null}
            {explanation ? (
              <p className="report-prose">{explanation}</p>
            ) : null}
            <ManifestationsBlock items={manifestations} />
            {fallbackQuestion ? (
              <div className="mt-8">
                <p className="report-theme-title pb-1">
                  Для наблюдения
                </p>
                <p className="report-quote">{fallbackQuestion}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Почему мы это видим">
              <span className="inline-flex items-baseline gap-1.5 text-white/45">
                <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-base leading-none text-[#F6E7A1]">
                  {tGlyph ? <span>{tGlyph}</span> : null}
                  {aspect ? <span>{aspect}</span> : null}
                  {nGlyph ? <span>{nGlyph}</span> : null}
                </span>
                <span className="text-base leading-snug">{pairLabel}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {windowText ? (
              <p className="report-lede">{windowText}</p>
            ) : null}
            {lead.map((paragraph) => {
              const text = withoutContained(paragraph, windowText);
              if (!text) return null;
              return (
                <p key={paragraph.slice(0, 80)} className="report-prose">
                  {text}
                </p>
              );
            })}
            <ManifestationsBlock items={manifestations} />
            {rest.map((paragraph) => (
              <p key={paragraph.slice(0, 80)} className="report-prose">
                {paragraph}
              </p>
            ))}
            {generatedQuestions.length > 0 ? (
              <div className="mt-8">
                <p className="report-theme-title pb-1">
                  зона для исследования
                </p>
                {generatedQuestions.map((question) => (
                  <p key={question.slice(0, 80)} className="report-quote">
                    {question}
                  </p>
                ))}
              </div>
            ) : null}
            {whyText ? <p className="mt-4 report-lede">{whyText}</p> : null}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Почему мы это видим">
              <span className="inline-flex items-baseline gap-1.5 text-white/45">
                <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-base leading-none text-[#F6E7A1]">
                  {tGlyph ? <span>{tGlyph}</span> : null}
                  {aspect ? <span>{aspect}</span> : null}
                  {nGlyph ? <span>{nGlyph}</span> : null}
                </span>
                <span className="text-base leading-snug">{pairLabel}</span>
              </span>
            </div>
          </div>
        )
      ) : null}
    </article>
  );
}

function glyphMap(document: ReportDocument): Map<string, string> {
  return new Map(
    (document.factual?.natal?.points ?? []).map((point) => [point.key, point.glyph || ""]),
  );
}

function resolveAstroPair(
  document: ReportDocument,
  sourceId?: string,
  sourceType?: string,
): (AstroPair & { label: string }) | null {
  const id = (sourceId || "").trim();
  if (!id) return null;
  const type = (sourceType || "").trim();
  if (type === "cycle" || !type) {
    const cards = [
      ...(document.interpretive?.cycles?.payload?.primary_cycles ?? []),
      ...(document.interpretive?.cycles?.payload?.secondary_cycles ?? []),
    ];
    const card = cards.find((row) => row.cycle_id === id || row.unit_key === id);
    if (card?.transit && card?.natal) {
      const pair = { left: card.transit, aspect: card.aspect || "", right: card.natal };
      const label =
        card.technical_title ||
        [card.transit_name, card.aspect_ru, card.natal_name].filter(Boolean).join(" ") ||
        astroPairLabel(pair);
      return { ...pair, label };
    }
  }
  if (type === "aspect" || !type) {
    const cards = document.interpretive?.aspects?.payload?.aspects ?? [];
    const card = cards.find((row) => row.aspect_id === id || row.unit_key === id);
    if (card?.a && card?.b) {
      const pair = { left: card.a, aspect: card.aspect || "", right: card.b };
      const label =
        [card.a_name, card.aspect_ru, card.b_name].filter(Boolean).join(" ") || astroPairLabel(pair);
      return { ...pair, label };
    }
  }
  const parsed = parseAstroPairId(id);
  if (!parsed) return null;
  return { ...parsed, label: astroPairLabel(parsed) };
}

function AstroPairCaption({
  pair,
  glyphByKey,
}: {
  pair: AstroPair & { label?: string };
  glyphByKey: Map<string, string>;
}) {
  const left = planetGlyph(pair.left, glyphByKey.get(pair.left || ""));
  const right = planetGlyph(pair.right, glyphByKey.get(pair.right || ""));
  const aspect = aspectGlyph(pair.aspect);
  const label = pair.label || astroPairLabel(pair);
  if (!left && !aspect && !right && !label) return null;
  return (
    <p className="mt-2 text-sm text-[color:var(--muted)]">
      <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-base leading-none text-[#F6E7A1]">
        {left ? <span>{left}</span> : null}
        {aspect ? <span>{aspect}</span> : null}
        {right ? <span>{right}</span> : null}
      </span>
      {label ? <span className="ml-2 align-baseline">{label}</span> : null}
    </p>
  );
}

function RequestTab({ document }: { document: ReportDocument }) {
  const payload = document.interpretive?.request?.payload;
  const section = document.sections?.request;

  if (!payload && !(section?.blocks?.length)) {
    return <p className="report-lede">запрос появится, когда слой соберётся.</p>;
  }

  const glyphByKey = glyphMap(document);
  const request = payload?.request;
  const connections = payload?.connections ?? [];
  const distinction = payload?.core_distinction ?? payload?.core_pattern;
  const resource = payload?.resource;
  const takeaway = payload?.takeaway;
  const resourcePair = resolveAstroPair(
    document,
    resource?.source_id || resource?.source,
    resource?.source_type,
  );

  if (!payload) {
    return (
      <div className="space-y-5">
        {(section?.blocks ?? []).filter((block) => !isTakeawayBlock(block)).map((block) => (
          <article key={block.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="report-theme-title pb-1">{block.title}</h3>
            <p className="mt-3 report-prose whitespace-pre-line">{block.text}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {request?.title || request?.text ? (
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          {request.title ? (
            <h3 className="report-theme-title pb-1">
              {request.title}
            </h3>
          ) : null}
          {request.text ? <p className="mt-3 report-prose">{request.text}</p> : null}
        </article>
      ) : null}

      {connections.map((row) => {
        const pair = resolveAstroPair(document, row.source_id || row.source, row.source_type);
        return (
          <article
            key={`${row.title}-${row.source_id || row.source}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="report-theme-title pb-1">{row.title}</h3>
            {pair ? <AstroPairCaption pair={pair} glyphByKey={glyphByKey} /> : null}
            {row.text ? <p className="mt-3 report-prose">{row.text}</p> : null}
          </article>
        );
      })}

      {distinction?.title || distinction?.text ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            {distinction.title || "Главное различение"}
          </h3>
          {distinction.text ? <p className="mt-3 report-prose">{distinction.text}</p> : null}
          {sourceCaptions(document, payload.core_distinction?.provenance, glyphByKey)}
        </article>
      ) : null}

      {resource?.text || resource?.title ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            {resource.title || "На что можно опереться"}
          </h3>
          {resourcePair ? <AstroPairCaption pair={resourcePair} glyphByKey={glyphByKey} /> : null}
          {resource.text ? <p className="mt-3 report-prose">{resource.text}</p> : null}
        </article>
      ) : null}

      {takeaway ? (
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          <h3 className="report-theme-title pb-1">Главное</h3>
          <p className="mt-3 report-prose">{takeaway}</p>
        </article>
      ) : null}
    </div>
  );
}

function sourceCaptions(
  document: ReportDocument,
  ids: string[] | undefined,
  glyphByKey: Map<string, string>,
) {
  const rows = (ids ?? [])
    .map((id) => ({ id, pair: resolveAstroPair(document, id) }))
    .filter((row): row is { id: string; pair: AstroPair & { label: string } } => Boolean(row.pair));
  if (!rows.length) return null;
  return (
    <div>
      {rows.map((row) => (
        <AstroPairCaption key={row.id} pair={row.pair} glyphByKey={glyphByKey} />
      ))}
    </div>
  );
}

function PracticeTab({ document }: { document: ReportDocument }) {
  const payload = document.interpretive?.practice?.payload;
  const section = document.sections?.practice;
  const questions = payload?.reflection_questions ?? section?.questions ?? [];

  if (!payload && !(section?.blocks?.length)) {
    return <p className="report-lede">практика появится, когда слой соберётся.</p>;
  }

  if (!payload) {
    return (
      <div className="space-y-5">
        {(section?.blocks ?? []).filter((block) => !isTakeawayBlock(block)).map((block) => (
          <article key={block.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="report-theme-title pb-1">{block.title}</h3>
            <p className="mt-3 report-prose whitespace-pre-line">{block.text}</p>
          </article>
        ))}
        {questions.length > 0 ? (
          <section className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
            <h3 className="report-theme-title pb-1">
              Вопросы для самостоятельной работы
            </h3>
            <ul className="mt-4 space-y-3">
              {questions.map((question) => (
                <li key={question} className="report-quote">
                  {question}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const start = payload.start_here;
  const pattern = payload.pattern;
  const protective = payload.protective_function;
  const cost = payload.cost;
  const values = payload.values;
  const experiment = payload.experiment;
  const distinctions = payload.key_distinctions ?? [];
  const observe = payload.observe_over_time ?? [];
  const glyphByKey = glyphMap(document);

  return (
    <div className="space-y-5">
      {start?.headline || start?.text ? (
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          {start.headline ? (
            <h3 className="report-theme-title pb-1">
              {start.headline}
            </h3>
          ) : null}
          {sourceCaptions(document, start.provenance ?? payload.provenance, glyphByKey)}
          {start.text ? <p className="mt-3 report-prose">{start.text}</p> : null}
        </article>
      ) : null}

      {pattern?.title || pattern?.text ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            {pattern.title}
          </h3>
          {sourceCaptions(document, pattern.source_ids, glyphByKey)}
          {pattern.text ? <p className="mt-3 report-prose">{pattern.text}</p> : null}
        </article>
      ) : null}

      {[protective, cost, values].map((row) =>
        row?.title || row?.text ? (
          <article
            key={row.title || row.text}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="report-theme-title pb-1">
              {row.title}
            </h3>
            {row.text ? <p className="mt-3 report-prose">{row.text}</p> : null}
          </article>
        ) : null,
      )}

      {distinctions.length > 0 ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            Что важно различить
          </h3>
          <ul className="report-prose mt-4 space-y-3">
            {distinctions.map((row) => (
              <li key={`${row.left}-${row.right}`}>
                <span className="text-[#F6E7A1]">
                  {row.left} ≠ {row.right}
                </span>
                {row.note ? ` - ${row.note}` : null}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {questions.length > 0 ? (
        <section className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          <h3 className="report-theme-title pb-1">
            Вопросы для самостоятельной работы
          </h3>
          <ul className="mt-4 space-y-3">
            {questions.map((question) => (
              <li key={question} className="report-quote">
                {question}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {experiment?.text || experiment?.title ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            {experiment.title || "Попробуй проверить"}
          </h3>
          {experiment.text ? <p className="mt-3 report-prose">{experiment.text}</p> : null}
          {experiment.duration ? (
            <p className="report-lede mt-3">Срок: {experiment.duration}</p>
          ) : null}
        </article>
      ) : null}

      {observe.length > 0 ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            Что наблюдать дальше
          </h3>
          <ul className="report-prose mt-4 space-y-2">
            {observe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
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
      className={`rounded-2xl border p-5 ${
        featured ? "border-[#F6E7A1]/40 bg-white/5" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium tracking-tight text-[#F6E7A1]">{polarity}</p>
        {typeof hit.orb === "number" ? (
          <p className="text-sm text-[color:var(--muted)]">орб {hit.orb}°</p>
        ) : null}
        {hit.motion ? <p className="text-sm text-[color:var(--muted)]">{hit.motion}</p> : null}
      </div>
      <h3 className="mt-2 text-lg font-medium leading-snug text-white">
        {hit.transit_name} {hit.aspect_ru} {hit.natal_name}
      </h3>
      {hit.fact ? <p className="mt-3 report-prose">{hit.fact}</p> : null}
      {compact ? null : (
        <>
          {hit.duration ? (
            <p className="report-lede mt-3">
              <span className="text-[#F6E7A1]">Длительность. </span>
              {hit.duration}
            </p>
          ) : null}
          {hit.meaning ? (
            <p className="report-prose mt-2">
              <span className="text-[#F6E7A1]">Что значит. </span>
              {hit.meaning}
            </p>
          ) : null}
          {hit.practice || hit.work_with ? (
            <p className="report-prose mt-2">
              <span className="text-[#F6E7A1]">Как работать. </span>
              {hit.practice || hit.work_with}
            </p>
          ) : null}
          {hit.use_for ? (
            <p className="report-prose mt-2">
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
  const sections = report.sections ?? [];
  return (
    <div className="mt-12 space-y-12">
      {sections.length > 0 ? (
        <>
          <nav aria-label="Разделы отчёта" className="mb-2 hidden flex-col gap-2 lg:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#report-${section.id}`}
                className="inline-flex min-h-11 items-center text-base text-[color:var(--muted)] transition hover:text-[#F6E7A1]"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </>
      ) : null}
      {sections.map((section) => (
        <section key={section.id} id={`report-${section.id}`} className="scroll-mt-28">
          <h2 className="report-group-title pb-1">{section.title}</h2>
          <div className="mt-5 space-y-6">
            {section.blocks.filter((block) => !isTakeawayBlock(block)).map((block) => (
              <div key={`${section.id}-${block.title}`}>
                <h3 className="text-lg font-medium leading-snug">{block.title}</h3>
                <p className="mt-2 report-prose">{block.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {report.disclaimer ? <p className="report-lede">{report.disclaimer}</p> : null}
    </div>
  );
}
