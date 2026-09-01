"use client";

import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import { CONTENT_UIS, mergeContentPayloads, screensForStep } from "@/lib/onboarding/screens";
import { sanitizePersonName } from "@/lib/person-name";

export const INSIGHT_OFFER_INDEX = 2;
export const INSIGHT_CONFIRM_INDEX = 3;
export const INSIGHT_SCREEN_COUNT = 4;

type InsightItem = { key: string; title: string; text: string };
type OfferCard = {
  key: string;
  label: string;
  before: string;
  after: string;
  hint?: string;
};

function labelFor(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function quizContext(
  steps: OnboardingStep[],
  payloadByStep: Record<string, Record<string, unknown>>,
  extraPayload?: Record<string, unknown>,
) {
  const contentPayload = {
    ...mergeContentPayloads(steps, payloadByStep),
    ...(extraPayload ?? {}),
  };
  const allScreens = [
    ...steps.flatMap((step) => screensForStep(step)),
    ...CONTENT_UIS.profile_quiz,
  ];
  const focusScreen = allScreens.find((s) => s.field === "focus" && s.kind !== "text");
  const intentScreen = allScreens.find((s) => s.field === "intent" && s.kind !== "text");
  const lifeScreen = allScreens.find((s) => s.field === "life_stage" && s.kind !== "text");

  const name =
    typeof contentPayload.name === "string" ? sanitizePersonName(contentPayload.name) : "";
  const focusLabels = asStringList(contentPayload.focus).map((value) =>
    focusScreen && focusScreen.kind !== "text" ? labelFor(focusScreen.options, value) : value,
  );
  const intentLabel =
    typeof contentPayload.intent === "string" && intentScreen && intentScreen.kind !== "text"
      ? labelFor(intentScreen.options, contentPayload.intent)
      : "";
  const lifeStageLabel =
    typeof contentPayload.life_stage === "string" && lifeScreen && lifeScreen.kind !== "text"
      ? labelFor(lifeScreen.options, contentPayload.life_stage)
      : "";

  return { name, focusLabels, intentLabel, lifeStageLabel };
}

const METHOD_TITLE = "Стань ближе к своему истинному я через подробный разбор";

const METHOD_BODY =
  "Разберём твой космопортрет: влияние планет, сильные конфигурации, напряжённые аспекты и слепые зоны. Соединим с активными циклами, расскажем об их значениях и как с ними работать.";

const METHOD_NOTE =
  "Расчёт производится на системе астрономических вычислений Swiss Ephemeris, с которой работают профессиональные астрологи.";

const DISCLAIMER_NOTE =
  "Материал носит информационный характер и не является заменой терапии или профессиональной помощи.";

const TOPIC_BLOCKS = [
  { key: "love", label: "отношения", hint: "как ты проявляешься в близости" },
  { key: "strength", label: "сильные стороны", hint: "твоя опора в периоды штормов" },
  { key: "clarity", label: "ясность", hint: "твои паттерны и что их запускает" },
  { key: "path", label: "реализация", hint: "возможности по карте" },
];

function fallbackOpening(
  _influences: InsightItem[],
  _focusLabels: string[],
  _intentLabel: string,
): { bridge: string; insight: string } {
  return {
    bridge: "",
    insight: "сейчас карта полезнее как способ точнее задать вопрос, а не как готовый ответ",
  };
}

function fallbackBody(
  _influences: InsightItem[],
  _focusLabels: string[],
  _intentLabel: string,
  _lifeStageLabel: string,
): string {
  return "Сейчас данных недостаточно для уверенного персонального вывода. Поэтому лучше взять эту интерпретацию как гипотезу и сверить её с опытом.";
}

function requestHint(focusLabels: string[], intentLabel: string): string {
  const topics = focusLabels.length ? focusLabels : intentLabel ? [intentLabel] : [];
  if (topics.length === 0) {
    return "Связь с твоим запросом: рекомендации и вопросы для самостоятельной работы.";
  }
  if (topics.length === 1) {
    return `Связь с твоим запросом «${topics[0]}»: рекомендации и вопросы для самостоятельной работы.`;
  }
  const quoted = topics.map((topic) => `«${topic}»`).join(", ");
  return `Связь с твоим запросом ${quoted}: рекомендации и вопросы для самостоятельной работы.`;
}

function fallbackOfferCards(focusLabels: string[], intentLabel: string): OfferCard[] {
  return [
    {
      key: "natal",
      label: "Твоя натальная карта",
      before: "32%",
      after: "81%",
      hint: "Сильные стороны, потребности, противоречия, повторяющиеся сценарии и как это связано с положениями планет.",
    },
    {
      key: "cycles",
      label: "Твои текущие периоды",
      before: "24%",
      after: "76%",
      hint: "Значение и длительность транзитов, которые выходят на первый план, и как с ними работать.",
    },
    {
      key: "tension",
      label: "Напряжение и ресурс",
      before: "38%",
      after: "84%",
      hint: "Поймёшь, как компенсировать напряжённые аспекты положительными, увидишь открытые окна возможностей по циклам.",
    },
    {
      key: "focus",
      label: "Разбор твоего запроса",
      before: "29%",
      after: "79%",
      hint: requestHint(focusLabels, intentLabel),
    },
  ];
}

/** Italicize a known accent phrase inside a title. */
function renderAccentTitle(title: string, accents: string[]) {
  const lower = title.toLowerCase();
  for (const accent of accents) {
    const idx = lower.indexOf(accent.toLowerCase());
    if (idx === -1) continue;
    return (
      <>
        {title.slice(0, idx)}
        <span className="font-display italic text-[#F6E7A1]">
          {title.slice(idx, idx + accent.length)}
        </span>
        {title.slice(idx + accent.length)}
      </>
    );
  }
  return title;
}

export function insightCtaLabel(screenIndex: number, insight?: OnboardingInsight | null): string {
  if (screenIndex === 0) return "Узнать больше";
  if (screenIndex === 1) return "Продолжить";
  if (screenIndex === INSIGHT_OFFER_INDEX) {
    const cta = insight?.insight.offer?.cta || "Получить за 777 ₽";
    return /₽|руб/i.test(cta) ? cta : `${cta} ₽`;
  }
  if (screenIndex >= INSIGHT_CONFIRM_INDEX) return "Всё верно — оплатить";
  return "Продолжить";
}

export function InsightFunnel({
  screenIndex,
  insight,
  steps,
  payloadByStep,
  extraPayload,
  className = "pt-6 pb-2 md:pt-8",
}: {
  screenIndex: number;
  insight: OnboardingInsight;
  steps: OnboardingStep[];
  payloadByStep: Record<string, Record<string, unknown>>;
  extraPayload?: Record<string, unknown>;
  className?: string;
}) {
  const { name, focusLabels, intentLabel, lifeStageLabel } = quizContext(
    steps,
    payloadByStep,
    extraPayload,
  );
  const influences = insight.insight.influences ?? [];
  const offerCards = fallbackOfferCards(focusLabels, intentLabel);

  const rawOpening =
    insight.insight.opening ?? fallbackOpening(influences, focusLabels, intentLabel);
  const insightClause =
    rawOpening.insight?.trim() ||
    fallbackOpening(influences, focusLabels, intentLabel).insight;
  const body =
    insight.insight.body?.trim() ||
    fallbackBody(influences, focusLabels, intentLabel, lifeStageLabel);
  const headlineInsight = name
    ? insightClause
    : insightClause.charAt(0).toUpperCase() + insightClause.slice(1);

  if (screenIndex === 0) {
    return (
      <div className={`reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-center ${className}`}>
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl">
          {name ? (
            <>
              {name},{" "}
              <span className="font-display italic text-[#F6E7A1]">{headlineInsight}</span>
            </>
          ) : (
            <span className="font-display italic text-[#F6E7A1]">{headlineInsight}</span>
          )}
        </h1>
        <p className="mt-6 text-[16px] font-normal leading-[1.55] text-white/80 sm:text-[17px]">
          {body}
        </p>
      </div>
    );
  }

  if (screenIndex === 1) {
    return (
      <div className={`reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-start md:justify-center ${className}`}>
        <h1 className="text-balance text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-[2rem]">
          {renderAccentTitle(METHOD_TITLE, ["истинному я"])}
        </h1>
        <p className="mt-5 text-pretty text-[16px] font-normal leading-[1.55] text-white/80 sm:text-[17px]">
          {METHOD_BODY}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {TOPIC_BLOCKS.map((topic) => (
            <div
              key={topic.key}
              className="rounded-2xl border border-[#F6E7A1]/22 bg-[#F6E7A1]/[0.06] px-3.5 py-3.5"
            >
              <p className="text-[15px] font-normal text-[#F6E7A1]">{topic.label}</p>
              <p className="mt-1.5 text-[13px] font-normal leading-snug text-white/80">
                {topic.hint}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[12px] font-normal leading-[1.5] text-white/70 sm:text-[13px]">
          {METHOD_NOTE}
        </p>
      </div>
    );
  }

  if (screenIndex !== INSIGHT_OFFER_INDEX) return null;

  return (
    <div className={`reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-center ${className}`}>
      <h1 className="text-balance text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-[2rem]">
        Что ты поймёшь{" "}
        <span className="font-display italic text-[#F6E7A1]">после разбора</span>
      </h1>

      <ol className="mt-7 flex flex-col">
        {offerCards.map((card, index) => (
          <li
            key={card.key}
            className="growth-item border-t border-white/10 py-3.5 first:border-t-0 first:pt-0"
            style={{ animationDelay: `${0.08 + index * 0.08}s` }}
          >
            <div className="flex gap-3.5">
              <span
                className="shrink-0 font-display text-xl italic leading-none text-[#F6E7A1]/90"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-normal leading-snug text-white">{card.label}</p>
                {card.hint ? (
                  <p className="mt-1 text-[13px] font-normal leading-snug text-white/80">
                    {card.hint}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[12px] font-normal leading-[1.5] text-white/70 sm:text-[13px]">
        {DISCLAIMER_NOTE}
      </p>
    </div>
  );
}
