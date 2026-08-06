import type { OnboardingStep } from "@/lib/api";
import { hrefFromUrlPath, INSIGHT_SLUG, isReservedSlug, stepHref } from "./paths";

export type TitlePart = { t: string; accent?: boolean };

export type ContentScreen =
  | {
      id: string;
      kind: "text";
      field: string;
      title: TitlePart[];
      placeholder?: string;
      inputType?: "text" | "email";
      autocomplete?: string;
    }
  | {
      id: string;
      kind: "single";
      field: string;
      title: TitlePart[];
      options: { value: string; label: string }[];
      columns?: 1 | 2;
    }
  | {
      id: string;
      kind: "multi";
      field: string;
      title: TitlePart[];
      hint?: string;
      options: { value: string; label: string }[];
    };

/**
 * Named content UIs. New multi-screen quizzes can be added here and referenced
 * from OnboardingStep.meta.ui — or define screens inline via meta.screens.
 */
export const CONTENT_UIS: Record<string, ContentScreen[]> = {
  profile_quiz: [
    {
      id: "name",
      kind: "text",
      field: "name",
      title: [
        { t: "Давай познакомимся, " },
        { t: "как тебя зовут?", accent: true },
      ],
      placeholder: "Твоё имя",
      autocomplete: "given-name",
    },
    {
      id: "gender",
      kind: "single",
      field: "gender",
      title: [{ t: "Укажи свой " }, { t: "пол", accent: true }],
      columns: 2,
      options: [
        { value: "female", label: "Женский" },
        { value: "male", label: "Мужской" },
      ],
    },
    {
      id: "age",
      kind: "single",
      field: "age",
      title: [{ t: "Сколько тебе " }, { t: "лет?", accent: true }],
      columns: 2,
      options: [
        { value: "18-24", label: "18–24" },
        { value: "25-34", label: "25–34" },
        { value: "35-44", label: "35–44" },
        { value: "45+", label: "45+" },
      ],
    },
    {
      id: "life_stage",
      kind: "single",
      field: "life_stage",
      title: [
        { t: "Какой период у тебя " },
        { t: "сейчас?", accent: true },
      ],
      options: [
        { value: "stable", label: "все довольно стабильно" },
        { value: "one-sphere", label: "меняется одна важная сфера" },
        { value: "many-spheres", label: "перестройки в нескольких сферах жизни" },
        { value: "ready-to-change", label: "чувствую, что пора что-то менять" },
        { value: "unclear", label: "пока не понимаю, что происходит" },
      ],
    },
    {
      id: "focus",
      kind: "multi",
      field: "focus",
      title: [
        { t: "Какая сфера жизни сейчас волнует " },
        { t: "больше всего?", accent: true },
      ],
      hint: "Можно выбрать несколько",
      options: [
        { value: "love", label: "отношения и любовь" },
        { value: "money", label: "деньги и работа" },
        { value: "energy", label: "энергия, ресурсы и восстановление" },
        { value: "confidence", label: "самооценка и уверенность" },
        { value: "path", label: "самореализация и поиск своего пути" },
        { value: "other", label: "другое" },
      ],
    },
    {
      id: "intent",
      kind: "single",
      field: "intent",
      title: [
        { t: "Какая у тебя главная цель " },
        { t: "на данный момент?", accent: true },
      ],
      options: [
        { value: "future", label: "узнать, что меня ждёт в ближайшем будущем" },
        { value: "potential", label: "понять себя и свой потенциал" },
        { value: "uncertainty", label: "найти выход из неопределённости" },
        { value: "relationships", label: "наладить отношения" },
        { value: "patterns", label: "понять закономерности своей жизни" },
        { value: "life-stage", label: "разобраться в текущем жизненном этапе" },
        { value: "other", label: "другое" },
      ],
    },
    {
      id: "chart_knowledge",
      kind: "single",
      field: "chart_knowledge",
      title: [
        { t: "Что ты уже знаешь про " },
        { t: "свою карту?", accent: true },
      ],
      options: [
        { value: "sun-only", label: "Только знак зодиака" },
        { value: "big-three", label: "Знак, луна или асцендент" },
        { value: "natal-chart", label: "Читаю свою натальную карту" },
        { value: "transits", label: "Разбираюсь в транзитах" },
      ],
    },
    {
      id: "astrology_trigger",
      kind: "single",
      field: "astrology_trigger",
      title: [
        { t: "Что обычно приводит тебя " },
        { t: "к астрологии?", accent: true },
      ],
      options: [
        { value: "understand-self", label: "Хочу понять, что со мной происходит" },
        { value: "person", label: "Не складывается с конкретным человеком" },
        { value: "decision", label: "Нужно принять решение" },
        { value: "check-feelings", label: "Хочу проверить свои ощущения" },
        { value: "curious", label: "Просто интересно" },
      ],
    },
  ],
};

function isContentScreen(value: unknown): value is ContentScreen {
  if (!value || typeof value !== "object") return false;
  const screen = value as ContentScreen;
  return (
    typeof screen.id === "string" &&
    typeof screen.field === "string" &&
    (screen.kind === "text" || screen.kind === "single" || screen.kind === "multi")
  );
}

/** Resolve multi-screen UI for a content/input/custom step from API meta. */
export function screensForStep(step: OnboardingStep): ContentScreen[] {
  const meta = step.meta ?? {};
  const rawScreens = meta.screens;
  if (Array.isArray(rawScreens)) {
    return rawScreens.filter(isContentScreen);
  }
  const ui = meta.ui;
  if (typeof ui === "string" && CONTENT_UIS[ui]) {
    return CONTENT_UIS[ui];
  }
  // Back-compat: old seed without meta.ui still gets the quiz on `welcome`.
  if (step.slug === "welcome" && step.step_type === "content") {
    return CONTENT_UIS.profile_quiz;
  }
  return [];
}

/** How many progress dots this API step contributes. */
export function progressWeight(step: OnboardingStep): number {
  if (step.step_type === "content" || step.step_type === "input" || step.step_type === "custom") {
    const screens = screensForStep(step);
    return Math.max(1, screens.length);
  }
  return 1;
}

export function buildProgressModel(steps: OnboardingStep[]) {
  const segments: { slug: string; offset: number; weight: number }[] = [];
  let offset = 0;
  for (const step of steps) {
    const weight = progressWeight(step);
    segments.push({ slug: step.slug, offset, weight });
    offset += weight;
  }
  return { total: offset, segments };
}

export function progressIndexFor(
  steps: OnboardingStep[],
  slug: string,
  screenIndex = 0,
): number {
  const model = buildProgressModel(steps);
  const segment = model.segments.find((item) => item.slug === slug);
  if (!segment) return 0;
  return segment.offset + Math.min(screenIndex, Math.max(0, segment.weight - 1));
}

export function orderedSteps(steps: OnboardingStep[]): OnboardingStep[] {
  return [...steps].sort((a, b) => a.order - b.order || a.id - b.id);
}

export function findStep(steps: OnboardingStep[], slug: string): OnboardingStep | undefined {
  return steps.find((step) => step.slug === slug);
}

export function adjacentStep(
  steps: OnboardingStep[],
  slug: string,
  direction: -1 | 1,
): OnboardingStep | null {
  const list = orderedSteps(steps);
  const index = list.findIndex((step) => step.slug === slug);
  if (index < 0) return null;
  return list[index + direction] ?? null;
}

export function firstStepHref(steps: OnboardingStep[]): string {
  const first = orderedSteps(steps)[0];
  return first ? hrefFromUrlPath(first.url_path) || stepHref(first.slug) : "/";
}

export function nextStepHref(steps: OnboardingStep[], slug: string): string {
  const next = adjacentStep(steps, slug, 1);
  if (next) return hrefFromUrlPath(next.url_path) || stepHref(next.slug);
  return stepHref(INSIGHT_SLUG);
}

export function prevStepHref(steps: OnboardingStep[], slug: string): string | null {
  const prev = adjacentStep(steps, slug, -1);
  if (!prev) return null;
  return hrefFromUrlPath(prev.url_path) || stepHref(prev.slug);
}

export function resumeHref(
  steps: OnboardingStep[],
  nextStep: OnboardingStep | null,
  status: string,
): string {
  if (status === "completed" || (!nextStep && steps.length > 0)) {
    return stepHref(INSIGHT_SLUG);
  }
  if (nextStep) {
    return hrefFromUrlPath(nextStep.url_path) || stepHref(nextStep.slug);
  }
  return firstStepHref(steps);
}

export function screenIsComplete(
  screen: ContentScreen,
  payload: Record<string, unknown>,
): boolean {
  const value = payload[screen.field];
  if (screen.kind === "multi") {
    return Array.isArray(value) && value.length > 0;
  }
  if (screen.kind === "text") {
    return typeof value === "string" && value.trim().length > 0;
  }
  return typeof value === "string" && value.length > 0;
}

/** First screen that still needs an answer (or last if all filled). */
export function firstIncompleteScreenIndex(
  screens: ContentScreen[],
  payload: Record<string, unknown>,
): number {
  if (screens.length === 0) return 0;
  const idx = screens.findIndex((screen) => !screenIsComplete(screen, payload));
  return idx === -1 ? screens.length - 1 : idx;
}

export { isReservedSlug, INSIGHT_SLUG, stepHref, hrefFromUrlPath };
