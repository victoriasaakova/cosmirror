"use client";

import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import { mergeContentPayloads, screensForStep } from "@/lib/onboarding/screens";

export const INSIGHT_SCREEN_COUNT = 5;

type InsightItem = { key: string; title: string; text: string };
type CyclePitch = { cycle_key: string; title: string; text: string };

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

function fallbackPitches(cycles: InsightItem[]): CyclePitch[] {
  const mk = (cycle: InsightItem, idx: number): CyclePitch => ({
    cycle_key: cycle.key,
    title: `Как пройти период «${cycle.title}»`,
    text: `${cycle.text} Cosmirror поможет увидеть, как это пересекается с твоей картой — и что поддержит тебя на этой неделе.`,
  });
  if (!cycles.length) {
    const generic: CyclePitch = {
      cycle_key: "cycle_0",
      title: "Как Cosmirror поможет в этом периоде",
      text: "Мы соберём персональный разбор под твою карту и текущий фон — чтобы не угадывать, а видеть опору.",
    };
    return [generic, { ...generic, title: "Твой ритм в переменах" }];
  }
  return [mk(cycles[0], 0), mk(cycles[1] ?? cycles[0], 1)];
}

function fallbackOutcomes(name: string) {
  return {
    title: name ? `${name}, что меняется уже через неделю` : "Что меняется уже через неделю",
    items: [
      "Понимаешь, что даёт энергию, а что её забирает",
      "Видишь свои сильные стороны и как их масштабировать",
      "Замечаешь повторяющиеся сценарии раньше, чем они снова закрутятся",
      "Легче выбирать решения, которые ближе к твоему ритму",
    ],
  };
}

export function insightCtaLabel(screenIndex: number, insight: OnboardingInsight): string {
  if (screenIndex >= INSIGHT_SCREEN_COUNT - 1) {
    return insight.insight.offer?.cta || "Оформить подписку";
  }
  return "Далее";
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
  const pitches =
    insight.insight.cycle_pitches && insight.insight.cycle_pitches.length >= 2
      ? insight.insight.cycle_pitches
      : fallbackPitches(cycles);
  const outcomes = insight.insight.outcomes ?? fallbackOutcomes(name);
  const offer = insight.insight.offer ?? {
    title: "Стань ближе к своему истинному я",
    text: "Персональный разбор под твою карту и текущий фон — без общих гороскопов.",
    cta: "Оформить подписку",
    price: "777 ₽/мес",
  };

  const contextLine = [
    lifeStageLabel ? `Сейчас: ${lifeStageLabel}` : "",
    focusLabels.length ? `в фокусе — ${focusLabels.join(", ")}` : "",
    intentLabel ? `цель: ${intentLabel}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  if (screenIndex === 0) {
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Разбор</p>
        <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
          {name ? (
            <>
              {name},{" "}
              <span className="font-display italic text-[#ff7b36]">вот что может влиять</span>
            </>
          ) : (
            <>
              Вот что может{" "}
              <span className="font-display italic text-[#ff7b36]">влиять сейчас</span>
            </>
          )}
        </h1>
        {contextLine ? (
          <p className="mt-4 text-sm font-light leading-relaxed text-white/50">{contextLine}.</p>
        ) : null}
        <InsightItems items={influences} className="mt-8" />
      </div>
    );
  }

  if (screenIndex === 1 || screenIndex === 2) {
    const pitch = pitches[screenIndex - 1];
    const cycle = cycles.find((c) => c.key === pitch.cycle_key) ?? cycles[screenIndex - 1];
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Фон цикла</p>
        {cycle ? (
          <p className="mt-3 text-sm font-light text-white/45">{cycle.title}</p>
        ) : null}
        <h1 className="mt-4 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
          {pitch.title}
        </h1>
        <p className="mt-6 text-[16px] font-light leading-relaxed text-white/70">{pitch.text}</p>
        {cycle ? (
          <p className="mt-8 border-t border-white/10 pt-6 text-sm font-light leading-relaxed text-white/45">
            {cycle.text}
          </p>
        ) : null}
      </div>
    );
  }

  if (screenIndex === 3) {
    return (
      <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Результат</p>
        <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
          {outcomes.title}
        </h1>
        <ul className="mt-8 space-y-5">
          {outcomes.items.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] font-light leading-relaxed text-white/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7b36]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 pb-4 md:pt-10">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Подписка</p>
      <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
        {offer.title}
      </h1>
      <p className="mt-6 text-[16px] font-light leading-relaxed text-white/70">{offer.text}</p>
      <p className="mt-10 font-display text-4xl tracking-tight text-[#ff7b36] sm:text-5xl">
        {offer.price || "777 ₽/мес"}
      </p>
      <p className="mt-2 text-sm font-light text-white/40">отмена в любой момент</p>
    </div>
  );
}

function InsightItems({ items, className = "" }: { items: InsightItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <section className={className}>
      <div className="space-y-7 border-t border-white/10 pt-6">
        {items.map((item) => (
          <article key={item.key}>
            <h2 className="font-display text-xl leading-snug text-white sm:text-2xl">{item.title}</h2>
            <p className="mt-2 text-[15px] font-light leading-relaxed text-white/65">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
