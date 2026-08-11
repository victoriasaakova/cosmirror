"use client";

import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import { mergeContentPayloads, screensForStep } from "@/lib/onboarding/screens";

export const INSIGHT_SCREEN_COUNT = 3;

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

function quizContext(
  steps: OnboardingStep[],
  payloadByStep: Record<string, Record<string, unknown>>,
) {
  const contentPayload = mergeContentPayloads(steps, payloadByStep);
  const allScreens = steps.flatMap((step) => screensForStep(step));
  const focusScreen = allScreens.find((s) => s.field === "focus");
  const intentScreen = allScreens.find((s) => s.field === "intent");
  const lifeScreen = allScreens.find((s) => s.field === "life_stage");

  const name = typeof contentPayload.name === "string" ? contentPayload.name.trim() : "";
  const focus = Array.isArray(contentPayload.focus) ? (contentPayload.focus as string[]) : [];
  const focusLabels =
    focusScreen && focusScreen.kind === "multi"
      ? focus.map((f) => labelFor(focusScreen.options, f)).filter(Boolean)
      : [];
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

const OPENING_BRIDGES = [
  "ты можешь замечать, что",
  "ты можешь чувствовать, что",
  "сейчас важно",
];

const PITCH_LINES = [
  "Персональный разбор реакций, потребностей и повторяющихся сценариев.",
  "Больше ясности в выборе, отношениях и ежедневном ритме.",
];

const TOPIC_BLOCKS = [
  { key: "love", label: "отношения", hint: "где подстройка, а где живая близость" },
  { key: "anchor", label: "опора", hint: "на что опираться в решениях и переменах" },
  { key: "clarity", label: "ясность", hint: "что запускает напряжение и повтор сценария" },
  { key: "energy", label: "энергия", hint: "где ресурс уходит и где восстанавливается" },
];

function titleToInsightClause(title: string): string {
  const t = title.trim();
  if (!t) return "пора прислушаться к себе";
  const low = t.toLowerCase();
  const map: Record<string, string> = {
    "тяга выйти из тесной роли": "пора выйти из тесной роли",
    "эмоциональная нагрузка цикла": "важно беречь эмоциональные границы",
    "что может отзываться сейчас": "важно замедлиться и прислушаться к себе",
    "размытие и чувствительность": "легко потерять ясность — стоит чаще сверяться с собой",
    "глубинная перестройка": "назрела внутренняя перестройка",
    "что имеет смысл наблюдать": "стоит внимательнее смотреть на свои автоматические реакции",
  };
  if (map[low]) return map[low];
  for (const prefix of ["тяга ", "желание ", "ощущение ", "тема "]) {
    if (low.startsWith(prefix)) {
      const rest = t.slice(prefix.length).trim();
      if (rest) return rest.charAt(0).toLowerCase() + rest.slice(1);
    }
  }
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function fallbackOpening(
  influences: InsightItem[],
  focusLabels: string[],
  intentLabel: string,
): { bridge: string; insight: string } {
  const seed = focusLabels.join("") + intentLabel;
  const bridge = OPENING_BRIDGES[Math.abs(seed.length) % OPENING_BRIDGES.length];
  const title = influences[0]?.title ?? "";
  return { bridge, insight: titleToInsightClause(title) };
}

function fallbackBody(
  influences: InsightItem[],
  focusLabels: string[],
  intentLabel: string,
  _lifeStageLabel: string,
): string {
  const focus = focusLabels[0] ?? "жизни";
  const primary = influences[0]?.text?.split(".")[0]?.trim();
  if (primary) {
    return `${primary}. Чтобы ${intentLabel.toLowerCase() || "разобраться в себе"}, важно сначала назвать, что уже не даёт опоры в теме «${focus}».`;
  }
  return `Сейчас особенно заметно, где привычная роль стала тесной в теме «${focus}». Чтобы ${intentLabel.toLowerCase() || "разобраться в себе"}, полезно честно увидеть, что больше не работает.`;
}

function fallbackOfferCards(focusLabels: string[]): OfferCard[] {
  const focus = focusLabels[0] ?? "жизни";
  return [
    {
      key: "natal",
      label: "Натальная карта",
      before: "32%",
      after: "81%",
      hint: "как устроены твои планеты и как они влияют на тебя",
    },
    {
      key: "cycles",
      label: "Текущие и ближайшие периоды",
      before: "24%",
      after: "76%",
      hint: "что происходит сейчас и что подсветится дальше",
    },
    {
      key: "crossings",
      label: "Пересечения с картой",
      before: "38%",
      after: "84%",
      hint: "где текущий фон цепляет твои личные темы",
    },
    {
      key: "focus",
      label: "Разбор под запрос",
      before: "29%",
      after: "79%",
      hint: `сильные стороны и паттерны в теме «${focus}»`,
    },
  ];
}

function fallbackOffer() {
  return {
    title: "Стань ближе к своему истинному я через подробный разбор",
    text: "",
    cta: "Получить за 777 ₽",
    price: "777 ₽",
  };
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

export function insightCtaLabel(screenIndex: number, insight: OnboardingInsight): string {
  if (screenIndex === 0) return "Узнать больше";
  if (screenIndex === 1) return "Продолжить";
  if (screenIndex >= INSIGHT_SCREEN_COUNT - 1) {
    const cta = insight.insight.offer?.cta || "Получить за 777 ₽";
    return /₽|руб/i.test(cta) ? cta : `${cta} ₽`;
  }
  return "Продолжить";
}

export function InsightFunnel({
  screenIndex,
  insight,
  steps,
  payloadByStep,
}: {
  screenIndex: number;
  insight: OnboardingInsight;
  steps: OnboardingStep[];
  payloadByStep: Record<string, Record<string, unknown>>;
}) {
  const { name, focusLabels, intentLabel, lifeStageLabel } = quizContext(steps, payloadByStep);
  const influences = insight.insight.influences ?? [];
  const offerCards = fallbackOfferCards(focusLabels);
  const offer = insight.insight.offer ?? fallbackOffer();

  const opening =
    insight.insight.opening ?? fallbackOpening(influences, focusLabels, intentLabel);
  const body =
    insight.insight.body?.trim() ||
    fallbackBody(influences, focusLabels, intentLabel, lifeStageLabel);

  if (screenIndex === 0) {
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-center pt-6 pb-2 md:pt-8">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl">
          {name ? (
            <>
              {name},{" "}
              <span className="text-white/90">{opening.bridge} </span>
              <span className="font-display italic text-[#F6E7A1]">{opening.insight}</span>
            </>
          ) : (
            <>
              <span className="text-white/90">
                {opening.bridge.charAt(0).toUpperCase() + opening.bridge.slice(1)}{" "}
              </span>
              <span className="font-display italic text-[#F6E7A1]">{opening.insight}</span>
            </>
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
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-center pt-6 pb-2 md:pt-8">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-[2rem]">
          Что ты получишь в{" "}
          <span className="font-display italic text-[#F6E7A1]">подробном разборе</span>
        </h1>
        <div className="mt-5 space-y-2">
          {PITCH_LINES.map((line) => (
            <p key={line} className="text-[16px] font-normal leading-[1.55] text-white/80">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          {TOPIC_BLOCKS.map((topic) => (
            <div
              key={topic.key}
              className="rounded-2xl border border-[#F6E7A1]/22 bg-[#F6E7A1]/[0.06] px-3.5 py-3.5"
            >
              <p className="text-[15px] font-normal text-[#F6E7A1]">{topic.label}</p>
              <p className="mt-1.5 text-[13px] font-normal leading-snug text-white/55">
                {topic.hint}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col justify-center pt-6 pb-2 md:pt-8">
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-[2rem]">
        {renderAccentTitle(offer.title, ["истинному я"])}
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
                  <p className="mt-1 text-[13px] font-normal leading-snug text-white/55">
                    {card.hint}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
