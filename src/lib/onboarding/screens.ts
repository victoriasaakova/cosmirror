import type { OnboardingStep } from "@/lib/api";
import {
  canonicalOnboardingSlug,
  hrefFromUrlPath,
  insightHrefForScreen,
  insightScreenForSlug,
  INSIGHT_SLUG,
  isReservedSlug,
  LEGACY_ONBOARDING_SLUGS,
  REPORT_SLUG,
  stepHref,
} from "./paths";
import { sanitizePersonName } from "@/lib/person-name";

export type TitlePart = { t: string; accent?: boolean };

export type ChoiceOption = {
  value: string;
  label: string;
  tip?: string;
};

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
      options: ChoiceOption[];
      columns?: 1 | 2;
    }
  | {
      id: string;
      kind: "multi";
      field: string;
      title: TitlePart[];
      hint?: string;
      options: ChoiceOption[];
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
        {
          value: "stable",
          label: "В целом всё стабильно",
          tip: "Не всему нужен ремонт. Посмотрим, куда направить внимание дальше.",
        },
        {
          value: "one-sphere",
          label: "Меняется одна важная сфера",
          tip: "Здесь лучше идти вглубь, а не охватывать всё. Начнём с главного.",
        },
        {
          value: "many-spheres",
          label: "Меняется сразу несколько сфер",
          tip: "События могут быть частями одного процесса. Поищем общую нить.",
        },
        {
          value: "unclear",
          label: "Чувствую перемены, но пока не понимаю их",
          tip: "Необязательно сразу всё понимать. Начнём с того, что уже ощущается.",
        },
      ],
    },
    {
      id: "focus",
      kind: "single",
      field: "focus",
      title: [
        { t: "С чем тебе сейчас важнее всего " },
        { t: "разобраться?", accent: true },
      ],
      options: [
        {
          value: "love",
          label: "Отношения и любовь",
          tip: "Не всё решают чувства. Иногда больше говорит сам способ быть рядом.",
        },
        {
          value: "money",
          label: "Работа и деньги",
          tip: "Не каждый тупик требует нового плана. Посмотрим, что держит на месте.",
        },
        {
          value: "energy",
          label: "Энергия и восстановление",
          tip: "Не вся усталость проходит после отдыха. Посмотрим, куда уходят силы.",
        },
        {
          value: "confidence",
          label: "Уверенность и самооценка",
          tip: "Сомнения не всегда про слабость. Иногда дело в чужой мерке.",
        },
        {
          value: "path",
          label: "Самореализация и свой путь",
          tip: "Не всякая цель действительно твоя. Отделим своё от чужих ожиданий.",
        },
      ],
    },
    {
      id: "goal",
      kind: "single",
      field: "intent",
      title: [
        { t: "Какая у тебя главная цель " },
        { t: "на данный момент?", accent: true },
      ],
      options: [
        {
          value: "life-stage",
          label: "Что происходит сейчас",
          tip: "Сначала отделим факты от реакции на них. Так станет видна причина.",
        },
        {
          value: "patterns",
          label: "Какие сценарии повторяются",
          tip: "Повторение начинается раньше, чем кажется. Посмотрим, где всё запускается.",
        },
        {
          value: "potential",
          label: "В чём мой потенциал",
          tip: "Сильная сторона не всегда похожа на талант. Часто она кажется чем-то обычным.",
        },
        {
          value: "uncertainty",
          label: "Куда двигаться дальше",
          tip: "Следующий шаг не обязан решать всё сразу. Достаточно, чтобы он вернул движение.",
        },
        {
          value: "future",
          label: "Чего ждать в ближайшее время",
          tip: "Точный прогноз начинается не с обещаний. Сначала нужна точка отсчёта.",
        },
      ],
    },
    {
      id: "astrolevel",
      kind: "single",
      field: "chart_knowledge",
      title: [
        { t: "Что ты знаешь о " },
        { t: "своей карте?", accent: true },
      ],
      options: [
        {
          value: "sun-only",
          label: "Знаю только свой знак",
          tip: "Начинать со словаря не придётся. Объясним карту через знакомые ситуации.",
        },
        {
          value: "big-three",
          label: "Знаю Солнце, Луну и асцендент",
          tip: "База уже есть. Покажем связи между отдельными положениями.",
        },
        {
          value: "transits",
          label: "Читаю карту и слежу за транзитами",
          tip: "Можно идти глубже. Покажем логику аспектов и текущих влияний.",
        },
      ],
    },
    {
      id: "questions",
      kind: "single",
      field: "astrology_trigger",
      title: [
        { t: "Что обычно приводит тебя " },
        { t: "к астрологии?", accent: true },
      ],
      options: [
        {
          value: "understand-self",
          label: "Хочу понять своё состояние",
          tip: "Назвать чувство бывает мало. Ясность приходит, когда видна его причина.",
        },
        {
          value: "person",
          label: "Думаю о конкретном человеке",
          tip: "В чужих поступках легко потерять себя. Вернём свою точку зрения в центр.",
        },
        {
          value: "decision",
          label: "Стою перед важным выбором",
          tip: "Ещё одно мнение редко решает выбор. Нужен собственный критерий.",
        },
        {
          value: "check-feelings",
          label: "Хочу свериться с собой",
          tip: "Иногда ответ уже есть. Проверим, почему ему пока трудно доверять.",
        },
        {
          value: "curious",
          label: "Мне просто интересно",
          tip: "Не каждому поиску нужна проблема. Иногда интерес сам открывает важное.",
        },
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

function canonicalScreenForField(field: string): ContentScreen | undefined {
  return CONTENT_UIS.profile_quiz.find((screen) => screen.field === field);
}

/** Old quiz keys that now share a visible option. */
const LEGACY_CHOICE_ALIASES: Record<string, Record<string, string>> = {
  focus: { future: "path" },
  chart_knowledge: { "natal-chart": "transits" },
};

export function canonicalChoiceValue(field: string, value: string): string {
  return LEGACY_CHOICE_ALIASES[field]?.[value] ?? value;
}

/** Resolve multi-screen UI for a content/input/custom step from API meta. */
export function screensForStep(step: OnboardingStep): ContentScreen[] {
  const meta = step.meta ?? {};
  const rawScreens = meta.screens;
  let screens: ContentScreen[] = [];
  if (Array.isArray(rawScreens)) {
    screens = rawScreens.filter(isContentScreen);
  } else {
    const ui = meta.ui;
    if (typeof ui === "string" && CONTENT_UIS[ui]) {
      screens = CONTENT_UIS[ui];
    } else if (step.slug === "welcome" && step.step_type === "content") {
      // Back-compat only: old monolith welcome step with no meta.
      screens = CONTENT_UIS.profile_quiz;
    }
  }
  return screens.map((screen) => {
    // Quiz copy for personalization screens lives in CONTENT_UIS so tips/labels
    // ship without waiting for a DB re-seed.
    if (
      screen.field === "life_stage" ||
      screen.field === "gender" ||
      screen.field === "age" ||
      screen.field === "focus" ||
      screen.field === "intent" ||
      screen.field === "chart_knowledge" ||
      screen.field === "astrology_trigger"
    ) {
      return canonicalScreenForField(screen.field) ?? screen;
    }
    return screen;
  });
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

export function mergeContentPayloads(
  steps: OnboardingStep[],
  payloadByStep: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const step of orderedSteps(steps)) {
    if (step.step_type !== "content" && step.step_type !== "input") continue;
    Object.assign(merged, payloadByStep[step.slug] ?? {});
  }
  return merged;
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
    if (typeof value !== "string") return false;
    if (screen.field === "name") return sanitizePersonName(value).length > 0;
    return value.trim().length > 0;
  }
  if (typeof value === "string" && value.length > 0) return true;
  return Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0;
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

export {
  canonicalOnboardingSlug,
  hrefFromUrlPath,
  insightHrefForScreen,
  insightScreenForSlug,
  INSIGHT_SLUG,
  isReservedSlug,
  LEGACY_ONBOARDING_SLUGS,
  REPORT_SLUG,
  stepHref,
};
