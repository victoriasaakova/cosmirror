import type { OnboardingStep } from "@/lib/api";
import { stepHref } from "./paths";
import { canonicalChoiceValue, orderedSteps } from "./screens";
import { sanitizePersonName } from "@/lib/person-name";

export const SYNTHESIS_SLUG = "understood";
export const SYNTHESIS_CTA = "Построить карту";
export const SYNTHESIS_PLACEHOLDER_ID = -1;

type Gender = "female" | "male" | "";

type Gendered = string | { base: string; female?: string; male?: string };

export type SynthesisCopy = {
  name: string;
  happening: string;
  question: string;
  method: string;
};

const LIFE_STAGE_COPY: Record<string, Gendered> = {
  stable:
    "Сейчас нет острой ломки привычного. Важнее увидеть, куда направить уже собранную опору.",
  "one-sphere":
    "Сейчас внимание собрано вокруг одной части жизни. Здесь лучше идти вглубь, а не раскладывать всё сразу.",
  "many-spheres":
    "Перемены затронули несколько частей жизни. Здесь важнее увидеть общий процесс, чем разбирать всё по отдельности.",
  unclear:
    "Есть ощущение сдвига, но его контур ещё неясен. Сначала уточним, что уже чувствуется.",
  "ready-to-change":
    "Привычный ход уже не держит. Посмотрим, что именно просит сдвига.",
};

const FOCUS_LEAD: Record<string, Gendered> = {
  love: "В центре сейчас отношения.",
  money: "В центре сейчас работа и деньги.",
  energy: "В центре сейчас энергия и состояние.",
  confidence: "В центре сейчас отношение к себе.",
  path: "В центре сейчас поиск своего направления.",
};

const INTENT_CLOSE: Record<string, Gendered> = {
  "life-stage": "Тебе хочется понять, что стоит за текущим моментом.",
  patterns: "Тебе хочется понять сценарий, который возвращается снова.",
  potential: "Тебе хочется яснее увидеть, где твоя сила.",
  uncertainty: "Тебе хочется понять следующий шаг, когда ясности ещё нет.",
  future: "Тебе хочется понять, что может открыться впереди.",
  relationships: "Тебе хочется понять, как выстраивается близость.",
  other: "Тебе хочется понять себя точнее в этой сфере.",
};

const TRIGGER_LEAD: Record<string, Gendered> = {
  "understand-self":
    "Ты обращаешься к астрологии, чтобы понять, что с тобой происходит.",
  person: "Ты обращаешься к астрологии, потому что в поле зрения конкретный человек.",
  decision: "Ты обращаешься к астрологии, чтобы яснее увидеть свой выбор.",
  "check-feelings": "Ты обращаешься к астрологии, чтобы свериться с собой.",
  curious: "Ты обращаешься к астрологии из интереса, без заранее собранного запроса.",
};

const KNOWLEDGE_CLOSE: Record<string, Gendered> = {
  "sun-only": "Объясним карту через знакомые ситуации, без лишнего словаря.",
  "big-three": "Покажем связи между положениями без лишней теории.",
  transits: "Соединим знакомую тебе карту с тем, что активно сейчас.",
};

const HAPPENING_FALLBACK =
  "Сначала уточним текущий контекст. Это даст опору для разбора карты.";
const QUESTION_FALLBACK =
  "Сначала соберём запрос в одну мысль. Потом посмотрим, что говорит карта.";
const METHOD_FALLBACK = "Покажем карту спокойным языком. Без лишней теории.";

const FOCUS_ALIASES: Record<string, string> = {
  future: "path",
  self_realization: "path",
};

function scalar(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first.trim() : "";
  }
  return "";
}

function choice(field: string, payload: Record<string, unknown>): string {
  const raw = scalar(payload[field]);
  if (!raw) return "";
  const canonical = canonicalChoiceValue(field, raw);
  if (field === "focus") return FOCUS_ALIASES[canonical] ?? canonical;
  return canonical;
}

function genderOf(payload: Record<string, unknown>): Gender {
  const value = scalar(payload.gender);
  if (value === "female" || value === "male") return value;
  return "";
}

function realize(unit: Gendered | undefined, gender: Gender): string {
  if (!unit) return "";
  if (typeof unit === "string") return unit;
  if (gender === "female" && unit.female) return unit.female;
  if (gender === "male" && unit.male) return unit.male;
  return unit.base;
}

function joinSentences(first: string, second: string): string {
  const parts = [first, second].map((item) => item.trim()).filter(Boolean);
  return parts.join(" ");
}

/** Static synthesis for the «Что мы уже поняли» screen. Never call an LLM here. */
export function buildSynthesis(payload: Record<string, unknown>): SynthesisCopy {
  const gender = genderOf(payload);
  const name = sanitizePersonName(scalar(payload.name));
  const lifeStage = choice("life_stage", payload);
  const focus = choice("focus", payload);
  const intent = choice("intent", payload);
  const trigger = choice("astrology_trigger", payload);
  const knowledge = choice("chart_knowledge", payload);

  const happening = realize(LIFE_STAGE_COPY[lifeStage], gender) || HAPPENING_FALLBACK;
  const question = joinSentences(
    realize(FOCUS_LEAD[focus], gender),
    realize(INTENT_CLOSE[intent], gender),
  ) || QUESTION_FALLBACK;
  const method = joinSentences(
    realize(TRIGGER_LEAD[trigger], gender),
    realize(KNOWLEDGE_CLOSE[knowledge], gender),
  ) || METHOD_FALLBACK;

  return { name, happening, question, method };
}

export function isSynthesisStep(step: OnboardingStep | null | undefined): boolean {
  if (!step) return false;
  if (step.slug === SYNTHESIS_SLUG) return true;
  return step.meta?.ui === "synthesis";
}

/** Keep the screen in the catalog even before the API row is re-seeded. */
export function ensureSynthesisStep(steps: OnboardingStep[]): OnboardingStep[] {
  const list = orderedSteps(steps);
  if (list.some(isSynthesisStep)) return list;

  const questions = list.find((step) => step.slug === "questions");
  const birthIdx = list.findIndex(
    (step) => step.step_type === "birth_data" || step.slug === "birth",
  );
  const birth = birthIdx >= 0 ? list[birthIdx] : null;
  let order = 85;
  if (questions && birth) {
    order = Math.floor((questions.order + birth.order) / 2);
    if (order === questions.order || order === birth.order) order = questions.order + 1;
  } else if (questions) {
    order = questions.order + 1;
  } else if (birth) {
    order = Math.max(1, birth.order - 1);
  }

  const synthetic: OnboardingStep = {
    id: SYNTHESIS_PLACEHOLDER_ID,
    slug: SYNTHESIS_SLUG,
    title: "Что мы уже поняли",
    subtitle: "",
    step_type: "content",
    order,
    is_required: true,
    fields_schema: {},
    meta: { ui: "synthesis" },
    url_path: stepHref(SYNTHESIS_SLUG),
  };

  const next = [...list];
  const insertAt = birthIdx >= 0 ? birthIdx : next.length;
  next.splice(insertAt, 0, synthetic);
  return next;
}
