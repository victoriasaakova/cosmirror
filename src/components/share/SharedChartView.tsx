import Image from "next/image";
import {
  aspectGlyph,
  formatDms,
  planetGlyph,
  signGlyph,
} from "@/lib/astro-glyphs";
import { SharedNatalWheel, type NatalWheelData } from "@/components/share/SharedNatalWheel";
import { SharedSignsTable } from "@/components/share/SharedSignsTable";
import { SiteFooter } from "@/components/SiteFooter";
import { freshOnboardingHref } from "@/lib/onboarding/paths";
import type {
  NatalFallbackTheme,
  NatalInterpretationPayload,
  NatalThemeSection,
  PaidReport,
  ReportDocument,
} from "@/lib/api";

const CORE = ["sun", "moon", "ascendant"] as const;
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

export function SharedChartView({ report }: { report: PaidReport | null }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[var(--background)] text-[var(--foreground)]">
      <SharedChartHeader />
      <div className="cabinet-shell relative z-10 mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pt-[var(--cabinet-header-offset)] pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:max-w-[68rem] lg:px-8">
        {report ? <SharedChartBody report={report} /> : <SharedChartMissing />}
      </div>
      <SiteFooter />
    </main>
  );
}

function SharedChartHeader() {
  return (
    <header className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex justify-center px-4">
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-full border border-white/20 bg-[#050d4a]/55 px-4 shadow-[0_12px_40px_rgba(5,13,74,0.5)] backdrop-blur-2xl md:h-14 md:px-5">
          <a href="/" className="flex h-full min-w-0 items-center justify-self-start">
            <span className="flex h-8 min-w-0 items-center gap-1">
              <span className="flex h-8 w-6 shrink-0 items-center justify-center">
                <Image
                  src="/images/eye-silver.webp"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain object-center mix-blend-screen"
                />
              </span>
              <span className="font-display truncate text-lg leading-none tracking-tight text-white">
                Cosmirror
              </span>
            </span>
          </a>
          <a
            href={freshOnboardingHref()}
            className="inline-flex h-8 min-w-[4.75rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#F6E7A1] px-4 text-sm font-medium text-[#0a1a3a] transition hover:bg-[#f0dc82] active:scale-[0.98] md:h-9"
          >
            Собрать свою
          </a>
        </div>
      </div>
    </header>
  );
}

function SharedChartMissing() {
  return (
    <div className="flex flex-1 flex-col justify-center py-24">
      <h1 className="text-3xl font-normal tracking-tight text-white sm:text-4xl">
        ссылка <span className="font-display italic text-[#F6E7A1]">недоступна</span>
      </h1>
      <p className="report-lede mt-4 max-w-md">Ссылка недоступна или её отозвали.</p>
      <a href={freshOnboardingHref()} className="cabinet-cta mt-10">
        Собрать свою карту
      </a>
    </div>
  );
}

function SharedChartBody({ report }: { report: PaidReport }) {
  const natal = report.document?.factual?.natal;
  const wheel = natal?.wheel as NatalWheelData | undefined;
  const hasBirthTime = Boolean(natal?.has_birth_time);
  return (
    <article className="mt-4 min-w-0 pb-8 sm:mt-6 lg:pb-16">
      <header className="reveal">
        <h1 className="text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl">
          Натальная{" "}
          <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">
            карта
          </span>
        </h1>
        {!hasBirthTime ? (
          <p className="report-lede mt-5">Асцендент и дома не считаем.</p>
        ) : null}
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
          {CORE.map((key) => {
            const point = findPoint(report, key);
            return (
              <li key={key} className="min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <p className="text-sm text-white/80">{coreLabel(key)}</p>
                <CoreValue point={point} missing={key === "ascendant" && !hasBirthTime} />
              </li>
            );
          })}
        </ul>
        {wheel?.planets?.length ? (
          <div className="mt-8 sm:mt-10">
            <div className="-mx-4 overflow-x-clip sm:mx-0">
              <SharedNatalWheel wheel={wheel} />
            </div>
            <ul className="mt-3 flex flex-col items-center gap-1.5 text-[0.75rem] leading-snug text-white/80 sm:mt-4 sm:flex-row sm:justify-center sm:gap-6">
              <li className="inline-flex items-center gap-2">
                <AspectSwatch kind="hard" />
                напряжение: квадрат и оппозиция
              </li>
              <li className="inline-flex items-center gap-2">
                <AspectSwatch kind="soft" />
                поддержка: тригон и секстиль
              </li>
            </ul>
          </div>
        ) : null}
        <SharedSignsTable points={natal?.points} hasBirthTime={hasBirthTime} />
      </header>
      <section className="mt-12">
        <h2 className="report-section-title pb-1">Расшифровка</h2>
        <div className="mt-8">
          <SharedNatalReading document={report.document} />
        </div>
      </section>
      {report.disclaimer ? <p className="report-lede mt-14">{report.disclaimer}</p> : null}
    </article>
  );
}

function SharedNatalReading({ document }: { document?: ReportDocument }) {
  if (!document) return null;
  const natal = document.interpretive?.natal?.payload;
  const usingLibrary = Boolean(natal?.placements?.length);
  const portrait = natal?.core_portrait;
  const points = (document.factual?.natal?.points ?? []) as NatalPoint[];
  const houses = document.factual?.natal?.houses ?? [];
  const byKey = new Map(points.map((point) => [point.key, point]));
  const grouped = NATAL_GROUPS.map((group) => ({
    ...group,
    items: group.keys.map((key) => byKey.get(key)).filter((point): point is NatalPoint => Boolean(point)),
  })).filter((group) => group.items.length > 0);
  const groupedKeys = new Set(NATAL_GROUPS.flatMap((group) => group.keys));
  const leftover = points.filter(
    (point) => !CORE.includes(point.key as (typeof CORE)[number]) && !groupedKeys.has(point.key),
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
          {portrait.headline ? <h3 className="report-theme-title pb-1">{portrait.headline}</h3> : null}
          {portrait.summary ? (
            <p className={`report-lede ${portrait.headline ? "mt-3" : ""}`}>{portrait.summary}</p>
          ) : null}
        </section>
      ) : (
        <p className="report-lede">
          Это гипотезы по уже посчитанной карте: положения и дома как рамка чтения, не приговор.
        </p>
      )}
      {grouped.map((group) => (
        <section key={group.title}>
          <h3 className="report-group-title pb-1">{group.title}</h3>
          <div className="mt-6 space-y-3">
            {group.items.map((point) => (
              <PlanetDetails
                key={point.key}
                point={point}
                copy={placementCopy(point, natal)}
                marks={marksForPoint(point.key, aspects)}
                glyphByKey={glyphByKey}
              />
            ))}
          </div>
        </section>
      ))}
      {leftover.length > 0 ? (
        <section>
          <h3 className="report-group-title pb-1">Что ещё звучит в карте</h3>
          <div className="mt-6 space-y-3">
            {leftover.map((point) => (
              <PlanetDetails
                key={point.key}
                point={point}
                copy={placementCopy(point, natal)}
                marks={marksForPoint(point.key, aspects)}
                glyphByKey={glyphByKey}
              />
            ))}
          </div>
        </section>
      ) : null}
      {extraSections.map((section) => (
        <section key={section.id || section.title}>
          <h3 className="report-group-title pb-1">{section.title}</h3>
          <div className="mt-4">
            <PlanetDetails
              point={{
                key: `section-${section.id}`,
                name: section.headline || section.title || "",
                sign_ru: "",
                fact: "",
              }}
              copy={sectionCopy(section)}
              marks={marksForSection(section.id || "", aspects)}
              glyphByKey={glyphByKey}
            />
          </div>
        </section>
      ))}
      {repeatingThemes.length > 0 ? (
        <section>
          <h3 className="report-group-title pb-1">Что повторяется</h3>
          <div className="mt-4 space-y-6">
            {repeatingThemes.map((theme) => (
              <ThemeBlock key={theme.theme_id || theme.headline} theme={theme} />
            ))}
          </div>
        </section>
      ) : null}
      {questions.length > 0 ? (
        <section>
          <h3 className="report-group-title pb-1">Для наблюдения</h3>
          <div className="mt-4 space-y-3">
            {questions.map((question) => (
              <p key={question} className="report-quote">
                {question}
              </p>
            ))}
          </div>
        </section>
      ) : null}
      {limitations.length > 0 ? <p className="report-lede">{limitations.join(" ")}</p> : null}
      {houses.length > 0 ? (
        <section>
          <h3 className="report-group-title pb-1">Где это может проявляться</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {houses.map((house) => {
              const glyph = signGlyph(house.sign);
              return (
                <div key={house.house} className="rounded-2xl border border-white/10 p-4">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-base text-[#F6E7A1]">
                    <span>{house.house}-й дом</span>
                    <span className="text-white/80">·</span>
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
      {theme.headline ? <h3 className="report-theme-title pb-1">{theme.headline}</h3> : null}
      {theme.narrative ? (
        <p className={`report-lede ${theme.headline ? "mt-3" : ""}`}>{theme.narrative}</p>
      ) : null}
      {theme.reflection_question ? <p className="report-quote">{theme.reflection_question}</p> : null}
    </div>
  );
}

function PlanetDetails({
  point,
  copy,
  marks,
  glyphByKey,
}: {
  point: NatalPoint;
  copy: { headline?: string; paragraphs: string[]; question: string; houseModifier?: string; why?: string };
  marks: Array<{
    aspect?: string;
    aspect_ru?: string;
    planetKey?: string;
    planetName?: string;
    otherKey?: string;
    otherName?: string;
    pair?: boolean;
  }>;
  glyphByKey: Map<string, string>;
}) {
  const glyph = signGlyph(point.sign);
  const dms = formatDms(point.degree, point.minute);
  return (
    <details className="select-text rounded-2xl border border-white/10 bg-white/5 p-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h4 className="min-w-0 break-words text-lg font-medium text-white">
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
        </h4>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[#F6E7A1]" aria-hidden>
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        {copy.headline ? <p className="report-theme-title">{copy.headline}</p> : null}
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 72)} className="report-prose">
            {paragraph}
          </p>
        ))}
        {copy.houseModifier ? <p className="report-prose">{copy.houseModifier}</p> : null}
        {copy.why ? <p className="report-lede">{copy.why}</p> : null}
        {copy.question ? (
          <div className="mt-8">
            <p className="report-theme-title pb-1">зона для исследования</p>
            <p className="report-quote">{copy.question}</p>
          </div>
        ) : null}
        {marks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {marks.map((mark, index) => {
              const aspect = aspectGlyph(mark.aspect);
              const left = planetGlyph(mark.planetKey, glyphByKey.get(mark.planetKey || ""));
              const right = mark.pair ? planetGlyph(mark.otherKey, glyphByKey.get(mark.otherKey || "")) : "";
              const label = mark.pair
                ? `${mark.planetName} ${mark.aspect_ru} ${mark.otherName}`
                : `${mark.aspect_ru} ${mark.planetName}`;
              return (
                <span
                  key={`${mark.aspect}-${mark.planetKey}-${mark.otherKey || ""}-${index}`}
                  className="inline-flex items-baseline gap-1.5 text-white/80"
                >
                  <span className="natal-astro-glyph inline-flex items-baseline gap-1 text-base leading-none text-[#F6E7A1]">
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
        {dms ? (
          <p className="mt-2 text-base text-white/50">
            {dms}
            {point.retrograde ? " · ретроград" : ""}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function placementCopy(point: NatalPoint, natal?: NatalInterpretationPayload) {
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
    if (card?.body) return { paragraphs: [card.body], question: card.question || "" };
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

function sectionCopy(section?: NatalThemeSection) {
  if (!section) return { paragraphs: [] as string[], question: "" };
  return {
    paragraphs: [section.summary || "", ...(section.deep_read ?? [])].filter(Boolean),
    question: section.question || "",
  };
}

function marksForPoint(
  key: string,
  aspects: NonNullable<NonNullable<NonNullable<ReportDocument["factual"]>["natal"]>["aspects"]>,
) {
  return aspects
    .filter((row) => row.a === key || row.b === key)
    .slice()
    .sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99))
    .slice(0, 6)
    .map((row) => ({
      aspect: row.aspect,
      aspect_ru: row.aspect_ru,
      planetKey: row.a === key ? row.b : row.a,
      planetName: row.a === key ? row.b_name : row.a_name,
    }));
}

function marksForSection(
  id: string,
  aspects: NonNullable<NonNullable<NonNullable<ReportDocument["factual"]>["natal"]>["aspects"]>,
) {
  let rows = aspects;
  if (id === "resource") rows = aspects.filter((row) => row.kind === "soft");
  else if (id === "flexibility") rows = aspects.filter((row) => row.kind === "hard");
  else if (id === "inner_conflict") {
    const sunMoon = aspects.filter(
      (row) => (row.a === "sun" && row.b === "moon") || (row.a === "moon" && row.b === "sun"),
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

function CoreValue({
  point,
  missing,
}: {
  point: { sign?: string; sign_ru?: string; degree?: number; minute?: number; fact?: string } | null;
  missing: boolean;
}) {
  if (missing || !point?.sign_ru) {
    return <p className="mt-1 text-base text-white/80">не считаем</p>;
  }
  const glyph = signGlyph(point.sign);
  const dms = formatDms(point.degree, point.minute);
  const meaning = (point.fact || "").split(/\sЭто может проявляться/)[0].trim();
  return (
    <div className="mt-1">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-white">
        {glyph ? (
          <span className="natal-astro-glyph text-[1.35rem] leading-none text-[#F6E7A1]" aria-hidden>
            {glyph}
          </span>
        ) : null}
        <span className="text-base">{point.sign_ru}</span>
        {dms ? <span className="text-sm text-white/50">{dms}</span> : null}
      </p>
      {meaning ? <p className="mt-2 text-base leading-relaxed text-[color:var(--muted)]">{meaning}</p> : null}
    </div>
  );
}

function findPoint(report: PaidReport, key: string) {
  const points = report.document?.factual?.natal?.points ?? [];
  const fromPoints = points.find((point) => point.key === key);
  if (fromPoints) return fromPoints;
  const fromWheel = report.document?.factual?.natal?.wheel?.planets?.find((planet) => planet.key === key);
  if (!fromWheel) return null;
  return {
    sign: fromWheel.sign,
    sign_ru: fromWheel.sign_ru,
    degree: fromWheel.degree,
    minute: fromWheel.minute,
  };
}

function coreLabel(key: (typeof CORE)[number]) {
  if (key === "sun") return "Солнце";
  if (key === "moon") return "Луна";
  return "Асцендент";
}

function AspectSwatch({ kind }: { kind: "hard" | "soft" }) {
  const hard = kind === "hard";
  return (
    <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="5"
        x2="27"
        y2="5"
        stroke={hard ? "#c45c5c" : "#7eafd6"}
        strokeOpacity={hard ? 0.78 : 0.7}
        strokeWidth={hard ? 1.6 : 1.35}
        strokeLinecap="round"
        strokeDasharray={hard ? undefined : "4.5 3.5"}
      />
    </svg>
  );
}
