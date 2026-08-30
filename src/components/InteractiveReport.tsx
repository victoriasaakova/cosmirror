"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportOpening } from "@/components/ReportOpening";
import { aspectGlyph, formatDms, planetGlyph, signGlyph } from "@/lib/astro-glyphs";
import {
  type CycleCard,
  type NatalAspectCard,
  type NatalFallbackTheme,
  type NatalInterpretationPayload,
  type NatalThemeSection,
  type PaidReport,
  type ReportDocument,
  type ReportTransitHit,
} from "@/lib/api";

type AspectCategoryFilter = "all" | "tension" | "resource" | "mixed";
type CycleCategoryFilter = "all" | "tension" | "support" | "mixed";

const CORE = ["sun", "moon", "ascendant"] as const;

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
};

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

function layerCollecting(
  layer?: { source?: string; can_generate?: boolean; payload?: unknown },
  generationStatus?: string,
): boolean {
  if (layer?.source === "llm") return false;
  if (!layer?.can_generate) return false;
  return generationStatus === "running";
}

export function InteractiveReport({
  report,
  displayName,
  orderId,
  downloading,
  onDownloadPdf,
  actionNote,
}: Props) {
  const [live, setLive] = useState(report);
  const [tab, setTab] = useState("home");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setLive((prev) => keepLlmLayers(prev, report));
  }, [report]);

  const document = live.document;
  const sectionTabs = document?.presentation?.web?.tabs ?? [];
  const tabs = REPORT_NAV.map((item) => ({ ...item }));

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
  const generatingNatal = layerCollecting(document?.interpretive?.natal, generationStatus);
  const generatingAspects = layerCollecting(document?.interpretive?.aspects, generationStatus);
  const generatingCycles = layerCollecting(document?.interpretive?.cycles, generationStatus);
  const generatingRequest = layerCollecting(document?.interpretive?.request, generationStatus);
  const generatingPractice = layerCollecting(document?.interpretive?.practice, generationStatus);

  const opening = (
    <ReportOpening
      report={live}
      displayName={displayName}
      orderId={orderId}
      downloading={downloading}
      onDownloadPdf={onDownloadPdf}
      actionNote={actionNote}
    />
  );

  if (!document || sectionTabs.length === 0) {
    return (
      <div className="min-w-0 pb-8 lg:pb-16">
        {opening}
        <LinearSections report={live} />
      </div>
    );
  }

  const activeNav = tabs.find((item) => item.id === tab);

  return (
    <div className="min-w-0 pb-8 lg:grid lg:grid-cols-[15.5rem_minmax(0,45rem)] lg:items-start lg:gap-10 lg:pb-16 xl:gap-14">
      <nav
        aria-label="Разделы отчёта"
        className="hidden lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100dvh-7.5rem)] lg:flex-col lg:gap-1.5 lg:self-start"
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

      <div className="min-w-0">
        {tab === "home" ? (
          <>
            {opening}
            {document ? (
              <MobileSectionCatalog document={document} onOpen={openSection} />
            ) : null}
          </>
        ) : null}

        {tab !== "home" && activeNav ? (
          <div className="mb-8 lg:mb-6">
            <button
              type="button"
              onClick={() => openSection("home")}
              className="mb-4 inline-flex min-h-11 items-center text-base text-[#F6E7A1] lg:hidden"
            >
              Все разделы
            </button>
            <h1 className="report-section-title pb-1">{activeNav.label}</h1>
          </div>
        ) : null}

        {tab === "natal" && generatingNatal ? (
          <p className="mt-2 text-base text-[#F6E7A1]/80">собираем подробный слой по карте…</p>
        ) : null}
        {tab === "aspects" && generatingAspects ? (
          <p className="mt-2 text-base text-[#F6E7A1]/80">собираем разбор связей внутри карты…</p>
        ) : null}
        {tab === "cycles" && generatingCycles ? (
          <p className="mt-2 text-base text-[#F6E7A1]/80">собираем карту текущего периода…</p>
        ) : null}
        {tab === "request" && generatingRequest ? (
          <p className="mt-2 text-base text-[#F6E7A1]/80">собираем пересечение с твоим запросом…</p>
        ) : null}
        {tab === "practice" && generatingPractice ? (
          <p className="mt-2 text-base text-[#F6E7A1]/80">собираем практику для самостоятельной работы…</p>
        ) : null}

        {tab !== "home" ? (
          <div>
            {tab === "natal" && !generatingNatal ? (
              <NatalTab document={document} focusKey={focusKey} />
            ) : null}
            {tab === "aspects" && !generatingAspects ? (
              <AspectsTab document={document} focusKey={focusKey} initialFilter={categoryFilter} />
            ) : null}
            {tab === "cycles" && !generatingCycles ? (
              <CyclesTab document={document} focusKey={focusKey} initialFilter={categoryFilter} />
            ) : null}
            {tab === "request" && !generatingRequest ? <RequestTab document={document} /> : null}
            {tab === "practice" && !generatingPractice ? <PracticeTab document={document} /> : null}
          </div>
        ) : null}

        {live.disclaimer ? (
          <p className="report-lede mt-14">{live.disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}

type RailCard = {
  key: string;
  name: string;
  caption?: string;
  captionGlyph?: string;
  meta?: string;
  badge?: string[];
};

type RailSection = {
  id: string;
  tab: string;
  title: string;
  subtitle: string;
  cards: RailCard[];
};

function pointLookup(document: ReportDocument) {
  return new Map((document.factual?.natal?.points ?? []).map((point) => [point.key, point]));
}

function groupCaption(points: NatalPoint[]): string {
  return points
    .map((point) => {
      const house = point.house ? `дом ${point.house}` : "";
      return [point.sign_ru, house].filter(Boolean).join(" · ");
    })
    .filter(Boolean)
    .join(", ");
}

function natalGroupCards(document: ReportDocument): RailCard[] {
  const byKey = pointLookup(document);
  const grouped = NATAL_GROUPS.map((group) => ({
    ...group,
    items: group.keys.map((key) => byKey.get(key)).filter((point): point is NatalPoint => Boolean(point)),
  })).filter((group) => group.items.length > 0);
  const groupedKeys = new Set(NATAL_GROUPS.flatMap((group) => group.keys));
  const leftover = (document.factual?.natal?.points ?? []).filter(
    (point) => !CORE.includes(point.key as (typeof CORE)[number]) && !groupedKeys.has(point.key),
  );
  const cards = grouped.map((group) => ({
    key: group.items[0]?.key || group.keys[0],
    name: group.title,
    caption: groupCaption(group.items),
    badge: group.items.flatMap((point) =>
      [planetGlyph(point.key, point.glyph), signGlyph(point.sign)].filter(Boolean),
    ),
  }));
  if (leftover.length) {
    cards.push({
      key: leftover[0].key,
      name: "Что ещё звучит в карте",
      caption: groupCaption(leftover),
      badge: leftover.flatMap((point) =>
        [planetGlyph(point.key, point.glyph), signGlyph(point.sign)].filter(Boolean),
      ),
    });
  }
  return cards;
}

function aspectCategoryCards(document: ReportDocument): RailCard[] {
  const points = pointLookup(document);
  const list = document.interpretive?.aspects?.payload?.aspects ?? [];
  const buckets: { filter: string; name: string; match: (card: NatalAspectCard) => boolean }[] = [
    { filter: "tension", name: "Напряженные", match: (card) => card.category === "tension" },
    { filter: "resource", name: "Ресурсные", match: (card) => card.category === "resource" },
    { filter: "mixed", name: "Смешанные", match: (card) => card.category === "mixed" },
    { filter: "all", name: "Все", match: () => true },
  ];
  return buckets.map((bucket) => {
    const matched = list.filter(bucket.match);
    const sample = matched.slice(0, 2);
    return {
      key: `filter:${bucket.filter}`,
      name: bucket.name,
      caption:
        bucket.filter === "all"
          ? list.length
            ? `${list.length} связей в карте`
            : "все связи в карте"
          : sample
              .map((card) => captionForPair(card.a, card.b, points) || `${card.a_name} ${card.aspect_ru} ${card.b_name}`)
              .filter(Boolean)
              .join(", ") || bucket.name.toLowerCase(),
      badge: sample
        .flatMap((card) => [planetGlyph(card.a, ""), aspectGlyph(card.aspect), planetGlyph(card.b, "")])
        .filter(Boolean)
        .slice(0, 6),
    };
  });
}

function cycleCategoryCards(document: ReportDocument): RailCard[] {
  const points = pointLookup(document);
  const payload = document.interpretive?.cycles?.payload;
  const list = [...(payload?.primary_cycles ?? []), ...(payload?.secondary_cycles ?? [])];
  const buckets: { filter: string; name: string; match: (card: CycleCard) => boolean }[] = [
    { filter: "tension", name: "Напряженные", match: (card) => card.category === "tension" },
    { filter: "support", name: "Ресурсные", match: (card) => card.category === "support" },
    { filter: "mixed", name: "Смешанные", match: (card) => card.category === "mixed" },
    { filter: "all", name: "Все", match: () => true },
  ];
  return buckets.map((bucket) => {
    const matched = list.filter(bucket.match);
    const sample = matched.slice(0, 2);
    return {
      key: `filter:${bucket.filter}`,
      name: bucket.name,
      caption:
        bucket.filter === "all"
          ? list.length
            ? `${list.length} циклов сейчас`
            : "все текущие циклы"
          : sample
              .map((card) => {
                const natal = card.natal ? points.get(card.natal) : undefined;
                const house = natal?.house ? `дом ${natal.house}` : "";
                return [natal?.sign_ru || card.natal_name, house].filter(Boolean).join(" · ");
              })
              .filter(Boolean)
              .join(", ") || bucket.name.toLowerCase(),
      badge: sample
        .flatMap((card) => {
          const natal = card.natal ? points.get(card.natal) : undefined;
          return [
            planetGlyph(card.transit, ""),
            aspectGlyph(card.aspect),
            planetGlyph(card.natal, natal?.glyph),
            signGlyph(natal?.sign),
          ];
        })
        .filter(Boolean)
        .slice(0, 6),
    };
  });
}

function captionForPair(a?: string, b?: string, points?: Map<string, NatalPoint>): string {
  if (!points) return "";
  return [a, b]
    .map((key) => {
      const point = key ? points.get(key) : undefined;
      if (!point) return "";
      const house = point.house ? `дом ${point.house}` : "";
      return [point.sign_ru, house].filter(Boolean).join(" · ");
    })
    .filter(Boolean)
    .join("  ·  ");
}

function textCards(items: { key: string; name: string; caption?: string }[]): RailCard[] {
  return items.map((item) => ({ key: item.key, name: item.name, caption: item.caption }));
}

function MobileSectionCatalog({
  document,
  onOpen,
}: {
  document: ReportDocument;
  onOpen: (id: string, itemKey?: string) => void;
}) {
  const quiz = document.quiz;
  const requestPayload = document.interpretive?.request?.payload;
  const requestItems = (requestPayload?.connections ?? []).map((row, index) => ({
    key: `request-conn-${index}`,
    name: row.title || "Пересечение",
    caption: firstLine(row.text),
  }));
  if (!requestItems.length) {
    for (const [index, block] of (document.sections?.request?.blocks ?? []).entries()) {
      requestItems.push({
        key: `request-${index}`,
        name: block.title,
        caption: firstLine(block.text),
      });
    }
  }
  if (!requestItems.length && quiz?.intent_label) {
    requestItems.push({
      key: "request-intent",
      name: quiz.intent_label,
      caption: quiz.focus_labels?.join(", ") || "",
    });
  }

  const practicePayload = document.interpretive?.practice?.payload;
  const practiceItems: { key: string; name: string; caption?: string }[] = [];
  if (practicePayload?.start_here?.headline) {
    practiceItems.push({
      key: "practice-start",
      name: practicePayload.start_here.headline,
      caption: firstLine(practicePayload.start_here.text),
    });
  }
  if (practicePayload?.experiment?.title || practicePayload?.experiment?.text) {
    practiceItems.push({
      key: "practice-experiment",
      name: practicePayload.experiment.title || "Попробуй проверить",
      caption: firstLine(practicePayload.experiment.text),
    });
  }
  if (!practiceItems.length) {
    for (const [index, block] of (document.sections?.practice?.blocks ?? []).entries()) {
      practiceItems.push({
        key: `practice-${index}`,
        name: block.title,
        caption: firstLine(block.text),
      });
    }
  }

  const byId = Object.fromEntries(REPORT_NAV.map((item) => [item.id, item]));
  const rows: RailSection[] = [
    {
      id: "natal",
      tab: "natal",
      title: byId.natal.label,
      subtitle: byId.natal.subtitle,
      cards: natalGroupCards(document),
    },
    {
      id: "aspects",
      tab: "aspects",
      title: byId.aspects.label,
      subtitle: byId.aspects.subtitle,
      cards: aspectCategoryCards(document),
    },
    {
      id: "cycles",
      tab: "cycles",
      title: byId.cycles.label,
      subtitle: byId.cycles.subtitle,
      cards: cycleCategoryCards(document),
    },
    {
      id: "request",
      tab: "request",
      title: byId.request.label,
      subtitle: byId.request.subtitle,
      cards: textCards(requestItems),
    },
    {
      id: "practice",
      tab: "practice",
      title: byId.practice.label,
      subtitle: byId.practice.subtitle,
      cards: textCards(practiceItems),
    },
  ].filter((row) => (row.id === "request" || row.id === "practice" ? true : row.cards.length > 0));

  return (
    <div className="mt-12 space-y-12 lg:hidden">
      {rows.map((row) => (
        <RailRow key={row.id} row={row} onOpen={onOpen} />
      ))}
    </div>
  );
}

function RailRow({
  row,
  onOpen,
}: {
  row: RailSection;
  onOpen: (id: string, itemKey?: string) => void;
}) {
  return (
    <section>
      <h2>
        <button
          type="button"
          onClick={() => onOpen(row.tab)}
          className="flex min-h-11 w-full items-baseline gap-2 text-left"
        >
          <span className="min-w-0 text-[1.65rem] leading-[1.15] tracking-tight text-white">{row.title}</span>
          <span className="shrink-0 font-display text-2xl italic leading-none text-[#F6E7A1]" aria-hidden>
            ›
          </span>
        </button>
      </h2>
      <p className="mt-1.5 max-w-[34ch] text-sm font-normal leading-snug text-[color:var(--muted)]">{row.subtitle}</p>
      <div className="-mx-5 mt-4 flex gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {row.cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onOpen(row.tab, card.key)}
            className="relative min-h-[7.5rem] w-[min(15.75rem,calc(100vw-4.5rem))] shrink-0 snap-start rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-5 text-left transition active:scale-[0.99]"
          >
            {card.badge?.length ? (
              <span className="natal-astro-glyph absolute right-4 top-4 text-[1.05rem] leading-none text-[#F6E7A1]">
                {card.badge.join("")}
              </span>
            ) : null}
            <span className="block pr-10 text-lg font-medium leading-snug text-white">{card.name}</span>
            {card.caption ? (
              <span className="mt-2 block pr-6 font-display text-[1.05rem] italic leading-snug text-[#F6E7A1]">
                {card.caption}
              </span>
            ) : null}
            {card.meta ? <span className="mt-2 block text-base text-[color:var(--muted)]">{card.meta}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function firstLine(text?: string): string {
  if (!text) return "";
  const cut = text.search(/[.!?]/);
  const raw = (cut >= 0 ? text.slice(0, cut + 1) : text).trim();
  return raw.length > 108 ? `${raw.slice(0, 105).trim()}…` : raw;
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
  const paragraphs = [
    card.summary || "",
    ...(card.deep_read ?? []),
    card.resource || "",
    tension,
    work,
  ].filter(Boolean);
  const questions = card.reflection_questions ?? [];
  const pairLabel = `${card.a_name} ${card.aspect_ru} ${card.b_name}`;

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
          <h3 className="mt-2 break-words text-lg font-medium text-white">
            <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
              {aGlyph ? <span>{aGlyph}</span> : null}
              {aspect ? <span>{aspect}</span> : null}
              {bGlyph ? <span>{bGlyph}</span> : null}
            </span>
            <span className="ml-2">
              {card.a_name} {card.aspect_ru} {card.b_name}
            </span>
          </h3>
          {card.headline ? (
            <p className="mt-2 report-theme-title">
              {card.headline}
            </p>
          ) : null}
        </div>
        <ChevronToggle open={open} onToggle={onToggle} />
      </div>
      {open ? (
        <div className="mt-4 space-y-3">
          {paragraphs.map((paragraph) => (
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
      ) : (
        <p className="mt-2 text-base text-[color:var(--muted)]">{card.headline || pairLabel}</p>
      )}
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
  const theme = card.human_theme || card.headline || "";
  const orb = card.timing?.orb_deg;
  const phase = card.timing?.phase;
  const explanation = card.short_explanation || card.summary || "";
  const fallbackQuestion = card.reflection_question || card.reflection_questions?.[0] || "";

  const deep = Array.isArray(card.deep_read)
    ? card.deep_read
    : card.deep_read
      ? [card.deep_read]
      : [];
  const generatedParagraphs = [
    card.summary || "",
    ...deep,
    card.personalization || "",
    card.protective_function || card.protective_hypothesis || "",
    card.resource || "",
    card.tension_or_blind_spot || "",
    card.how_to_work || card.flexibility || "",
  ].filter(Boolean);
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
          <h3 className="mt-2 break-words text-lg font-medium text-white">
            <span className="inline-flex items-baseline gap-1 natal-astro-glyph text-[#F6E7A1]">
              {tGlyph ? <span>{tGlyph}</span> : null}
              {aspect ? <span>{aspect}</span> : null}
              {nGlyph ? <span>{nGlyph}</span> : null}
            </span>
            <span className="ml-2">{pairLabel}</span>
          </h3>
          {theme ? (
            <p className="mt-2 report-theme-title">
              {theme}
            </p>
          ) : null}
        </div>
        <ChevronToggle open={open} onToggle={onToggle} />
      </div>
      {open ? (
        compact ? (
          <div className="mt-4 space-y-3">
            {card.timing?.active_window_text ? (
              <p className="report-lede">{card.timing.active_window_text}</p>
            ) : null}
            {explanation ? (
              <p className="report-prose">{explanation}</p>
            ) : null}
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
            {card.timing?.active_window_text ? (
              <p className="report-lede">{card.timing.active_window_text}</p>
            ) : null}
            {generatedParagraphs.map((paragraph) => (
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
      ) : (
        <p className="mt-2 text-base text-[color:var(--muted)]">{theme || pairLabel}</p>
      )}
    </article>
  );
}

function RequestTab({ document }: { document: ReportDocument }) {
  const payload = document.interpretive?.request?.payload;
  const section = document.sections?.request;

  if (!payload && !(section?.blocks?.length)) {
    return <p className="report-lede">запрос появится, когда слой соберётся.</p>;
  }

  const request = payload?.request;
  const connections = payload?.connections ?? [];
  const distinction = payload?.core_distinction ?? payload?.core_pattern;
  const resource = payload?.resource;
  const takeaway = payload?.takeaway;

  if (!payload) {
    return (
      <div className="space-y-5">
        {(section?.blocks ?? []).map((block) => (
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
        const sourceLabel = [row.source_type, row.source_id || row.source]
          .filter(Boolean)
          .join(" · ");
        return (
          <article
            key={`${row.title}-${row.source_id || row.source}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="report-theme-title pb-1">{row.title}</h3>
            {sourceLabel ? (
              <p className="mt-2 text-sm text-[color:var(--muted)]">{sourceLabel}</p>
            ) : null}
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
        </article>
      ) : null}

      {resource?.text || resource?.title ? (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="report-theme-title pb-1">
            {resource.title || "На что можно опереться"}
          </h3>
          {resource.source_id || resource.source ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {resource.source_id || resource.source}
            </p>
          ) : null}
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
        {(section?.blocks ?? []).map((block) => (
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
  const takeawayPrompt = payload.user_takeaway_prompt;

  return (
    <div className="space-y-5">
      {start?.headline || start?.text ? (
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          {start.headline ? (
            <h3 className="report-theme-title pb-1">
              {start.headline}
            </h3>
          ) : null}
          {start.text ? <p className="mt-3 report-prose">{start.text}</p> : null}
        </article>
      ) : null}

      {[pattern, protective, cost, values].map((row) =>
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

      {takeawayPrompt ? (
        <article className="rounded-2xl border border-[#F6E7A1]/20 bg-white/5 p-5">
          <h3 className="report-theme-title pb-1">Твой вывод</h3>
          <p className="mt-3 report-prose text-[color:var(--muted)]">{takeawayPrompt}</p>
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
            {section.blocks.map((block) => (
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
