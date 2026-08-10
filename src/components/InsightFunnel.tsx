"use client";

import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import { mergeContentPayloads, screensForStep } from "@/lib/onboarding/screens";

export const INSIGHT_SCREEN_COUNT = 4;

type InsightItem = { key: string; title: string; text: string };
type OutcomeCard = {
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
  "сейчас подсвечивается, что",
  "сейчас видно, что",
  "сейчас пространство показывает, что",
  "сейчас тебе подсвечивается, что",
  "сейчас особенно заметно, что",
  "сейчас на фоне циклов видно, что",
  "сейчас карта подсказывает, что",
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

function fallbackProductPitch(
  focusLabels: string[],
  intentLabel: string,
  _cycles: InsightItem[],
  _insight: OnboardingInsight,
) {
  const focus = focusLabels[0] ?? "жизни";
  return {
    title: "Связываем карту, циклы и твои реакции",
    text: `В теме «${focus}» покажем повторяющийся сценарий раньше — чтобы ${intentLabel.toLowerCase() || "разобраться в себе"}, а не снова действовать на автомате.`,
  };
}

function parsePercent(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? Math.min(100, Math.max(0, Number(match[1]))) : 35;
}

function fallbackOutcomeCards(): OutcomeCard[] {
  return [
    {
      key: "clarity",
      label: "Ясность",
      before: "32%",
      after: "81%",
      hint: "видишь, что даёт энергию",
    },
    {
      key: "patterns",
      label: "Паттерны",
      before: "24%",
      after: "76%",
      hint: "замечаешь повторения раньше",
    },
    {
      key: "strengths",
      label: "Сильные стороны",
      before: "38%",
      after: "84%",
      hint: "понимаешь, что масштабировать",
    },
    {
      key: "rhythm",
      label: "Свой ритм",
      before: "29%",
      after: "79%",
      hint: "легче выбирать решения",
    },
  ];
}

function fallbackOutcomes(name: string) {
  return {
    title: name ? `${name}, что меняется уже через неделю` : "Что меняется уже через неделю",
    cards: fallbackOutcomeCards(),
  };
}

function legacyProductPitch(insight: OnboardingInsight) {
  const pitch = insight.insight.cycle_pitches?.[0];
  if (!pitch) return null;
  return { title: pitch.title, text: pitch.text };
}

export function insightCtaLabel(screenIndex: number, insight: OnboardingInsight): string {
  if (screenIndex === 0) return "Узнать больше";
  if (screenIndex === 1 || screenIndex === 2) return "Продолжить";
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
  const cycles = insight.insight.cycles ?? [];
  const productPitch =
    insight.insight.product_pitch ??
    legacyProductPitch(insight) ??
    fallbackProductPitch(focusLabels, intentLabel, cycles, insight);
  const outcomes = insight.insight.outcomes?.cards?.length
    ? insight.insight.outcomes
    : fallbackOutcomes(name);
  const offer = insight.insight.offer ?? {
    title: "Стань ближе к своему истинному я через подробный разбор",
    text: "Персональный разбор под твою карту и текущие циклы.\nОтслеживание энергии и паттернов без общих гороскопов.",
    cta: "Получить за 777 ₽",
    price: "777 ₽",
  };
  const offerLines = offer.text.split(/\n+/).filter(Boolean);

  const opening =
    insight.insight.opening ?? fallbackOpening(influences, focusLabels, intentLabel);
  const body =
    insight.insight.body?.trim() ||
    fallbackBody(influences, focusLabels, intentLabel, lifeStageLabel);

  if (screenIndex === 0) {
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
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
        <p className="mt-8 text-[16px] font-normal leading-[1.65] text-white/80 sm:text-[17px]">
          {body}
        </p>
      </div>
    );
  }

  if (screenIndex === 1) {
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-[2rem]">
          {productPitch.title}
        </h1>
        <p className="mt-6 text-[18px] font-normal leading-[1.7] text-white/80">{productPitch.text}</p>
      </div>
    );
  }

  if (screenIndex === 2) {
    const cards = outcomes.cards ?? fallbackOutcomeCards();
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl">
          {outcomes.title}
        </h1>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <OutcomeMetricCard key={card.key} card={card} />
          ))}
        </div>
        <p className="mt-6 text-center text-xs font-normal text-white/50">
          ориентир по первой неделе с Cosmirror
        </p>
      </div>
    );
  }

  return (
    <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl">
        {offer.title}
      </h1>
      <div className="mt-6 space-y-3">
        {offerLines.map((line) => (
          <p key={line} className="text-[16px] font-normal leading-relaxed text-white/80">
            {line}
          </p>
        ))}
      </div>
      <p className="mt-10 text-sm font-normal text-white/50">разовый доступ · без подписки</p>
    </div>
  );
}

function OutcomeMetricCard({ card }: { card: OutcomeCard }) {
  const beforePct = parsePercent(card.before);
  const afterPct = parsePercent(card.after);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">{card.label}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-white/35">сейчас</p>
          <p className="text-xl font-normal text-white/55">{card.before}</p>
        </div>
        <span className="text-white/25" aria-hidden>
          →
        </span>
        <div className="text-right">
          <p className="text-[11px] text-[#F6E7A1]/70">через неделю</p>
          <p className="text-xl font-normal text-[#F6E7A1]">{card.after}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/30 transition-all duration-700"
            style={{ width: `${beforePct}%` }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#F6E7A1]/15">
          <div
            className="h-full rounded-full bg-[#F6E7A1] transition-all duration-700"
            style={{ width: `${afterPct}%` }}
          />
        </div>
      </div>
      {card.hint ? (
        <p className="mt-3 text-[12px] font-normal leading-snug text-white/50">{card.hint}</p>
      ) : null}
    </article>
  );
}
