import type {
  BondSummaryCard,
  CompatibilityResult,
  PersonCycle,
  ScoreIndex,
  PersonId,
  RelationshipKind,
  RelationshipStage,
  SignComparison,
  SynastryAspect,
} from "@/lib/compatibility/types";
import { ASPECT_RU, PLANET_RU } from "@/lib/astro-glyphs";

const SOFT = new Set(["conjunction", "sextile", "trine"]);
const HARD = new Set(["square", "opposition"]);
const KARMIC = new Set(["north_node", "south_node", "pluto", "saturn", "chiron"]);
const NEAR = new Set(["sun", "moon", "venus"]);
const VALUE = new Set(["moon", "venus"]);
const SHOWN = new Set(["sun", "mars", "mercury", "ascendant"]);

const SUPPORT = "То, что между вами легче поддерживается";
const ATTRACTION = "Интерес и ответное движение";
const TENSION = "Разница ритма";
const TRIALS = "Тема усилия и предела";
const SHIFT = "Связка, которая может сдвигать привычное";

export const INSIGHT_FALLBACK_TITLE = "Между вами есть своя динамика";

export type GlyphPair = {
  id: string;
  pointA: string;
  aspect: string;
  pointB: string;
};

export type DeepTopic = {
  id: string;
  title: string;
  accent: string;
  insight: string;
  preview: string;
  paragraphs: { label: string; text: string }[];
  glyphs: GlyphPair[];
  astro: string[];
};

export type ReadingMetric = {
  id: string;
  title: string;
  accent: string;
  value: number | null;
  text: string;
};

export type ReadingCycle = {
  personId: PersonId;
  name: string;
  title: string;
  period: string;
  text: string;
};

export type ReadingModel = {
  insightFrame: "base" | "current";
  insightTitle: string;
  insightText: string;
  insightBasis: string;
  metrics: ReadingMetric[];
  topics: DeepTopic[];
  conclusionLead: string;
  conclusionAccent: string;
  conclusionText: string;
  cycles: ReadingCycle[];
};

export function buildReadingModel(
  result: CompatibilityResult,
  names: Record<PersonId, string>,
  kind: RelationshipKind | null,
  stage: RelationshipStage | null,
): ReadingModel {
  const aspects = result.aspects.filter((aspect) => aspect.primary || aspect.interpretation);
  const support = story(result, "support");
  const attraction = story(result, "attraction");
  const tension = story(result, "tension");
  const care = story(result, "care");
  const dynamic = story(result, "dynamic");

  const generated = result.insight?.status === "ready" ? result.insight : null;
  const insightTitle = clean(generated?.title) || clean(result.overview.title) || clean(dynamic?.headline) || INSIGHT_FALLBACK_TITLE;
  const insightText = generated?.body
    ? clean(generated.body)
    : uniqueText(
        insightTitle,
        result.cycles.couple.text,
        result.cycles.background,
        result.overview.summary,
        dynamic?.text,
      );
  const insightFrame = result.insight?.temporalFrame ?? (result.cycles.active.length ? "current" : "base");
  const insightBasis = clean(generated?.basis);

  const harmony = sentence(support?.text || bondText(result, SUPPORT) || softReading(aspects));
  const karmic = sentence(karmicReading(aspects, names) || care?.text || bondText(result, TRIALS));
  const now = sentence(currentTension(result) || tension?.text || bondText(result, TENSION));
  const shift = sentence(bondText(result, SHIFT) || plutoReading(aspects) || care?.text);

  const nearAspects = pick(aspects, NEAR, SOFT);
  const hardAspects = pick(aspects, null, HARD);
  const valueAspects = pick(aspects, VALUE, null);
  const shownAspects = pick(aspects, SHOWN, null);
  const fromApi = result.deepSections?.length
    ? result.deepSections.map((section) => {
        const [title, accent] = sectionHeading(kind, section.id);
        return topic({
          id: section.id,
          title,
          accent,
          insight: section.title,
          preview: section.teaser,
          paragraphs: section.paragraphs || [],
          glyphs: section.glyphs,
          astro: section.aspectLines || [],
        });
      })
    : null;
  const topics: DeepTopic[] = fromApi || [
    topic({
      id: "near",
      title: "Что вас сближает и",
      accent: "притягивает",
      insight: "",
      paragraphs: [],
      preview: support?.text || harmony || prose(nearAspects) || attraction?.text || bondText(result, ATTRACTION),
      glyphs: pairs(nearAspects),
      astro: lines(nearAspects, names),
    }),
    topic({
      id: "differ",
      title: "В чём вы различаетесь и",
      accent: "конфликтуете",
      insight: "",
      paragraphs: [],
      preview: tension?.text || bondText(result, TENSION) || prose(hardAspects),
      glyphs: pairs(hardAspects),
      astro: lines(hardAspects, names),
    }),
    topic({
      id: "values",
      title: "Какие ценности и потребности",
      accent: "пересекаются",
      insight: "",
      paragraphs: [],
      preview: signText(result, VALUE) || prose(valueAspects),
      glyphs: signGlyphs(result, VALUE).concat(pairs(valueAspects)).slice(0, 3),
      astro: signLines(result, VALUE, names).concat(lines(valueAspects, names)),
    }),
    topic({
      id: "shown",
      title: "Как вы проявляетесь",
      accent: "друг с другом",
      insight: "",
      paragraphs: [],
      preview: signText(result, SHOWN) || prose(shownAspects),
      glyphs: signGlyphs(result, SHOWN).concat(pairs(shownAspects)).slice(0, 3),
      astro: signLines(result, SHOWN, names).concat(lines(shownAspects, names)),
    }),
  ];

  return {
    insightFrame,
    insightTitle,
    insightBasis,
    insightText:
      insightText ||
      (insightFrame === "current"
        ? "Короткий вывод о том, что происходит между вами сейчас, появится здесь."
        : "Короткий вывод о базовой динамике вашей связи появится здесь."),
    metrics: [
      metric("harmony", "Гармония и", "совместимость", result.scores?.harmony, harmony || "Отдельной поддерживающей связки в этих картах не выделено."),
      metric("karmic", "Кармическая", "связь", result.scores?.karmic, karmic || "Узлы, Сатурн или Плутон не дают здесь отдельной короткой связки."),
      metric("now", "Напряжение", "сейчас", result.scores?.currentTension, now || "Период, который задаёт напряжение сейчас, ещё не посчитан."),
      metric("shift", "Потенциал", "трансформации", result.scores?.transformation, shift || "Отдельной темы трансформации в этих картах не выделено."),
    ],
    topics: topics.map(fillTopic),
    conclusionLead: result.readingConclusion ? "Главное о вашей" : "Главное в вашем",
    conclusionAccent: result.readingConclusion ? "связи" : "контакте",
    conclusionText: result.readingConclusion?.text || conclusionText(kind, stage, support?.text, tension?.text),
    cycles: (["A", "B"] as PersonId[]).map((personId) => cycleSlot(result, personId, names[personId])),
  };
}

function metric(id: string, title: string, accent: string, score: ScoreIndex | undefined, fallback: string): ReadingMetric {
  const hidden = !score || score.status === "pending" || score.status === "unavailable" || score.status === "error" || score.value == null;
  return {
    id,
    title,
    accent,
    value: hidden ? null : score.value,
    text: clean(score?.summary) || fallback,
  };
}

function sectionHeading(kind: RelationshipKind | null, id: string): [string, string] {
  const romantic: Record<string, [string, string]> = {
    common_ground: ["Что вас сближает и", "притягивает"],
    differences: ["Где вы различаетесь и", "что может задевать"],
    values_needs: ["Ваши ценности и", "потребности"],
    mutual_expression: ["Как вы проявляетесь", "друг с другом"],
  };
  const friendship: Record<string, [string, string]> = {
    common_ground: ["Что поддерживает", "вашу дружбу"],
    differences: ["Где возникают споры и", "непонимание"],
    values_needs: ["Что каждый ценит", "в дружбе"],
    mutual_expression: ["Как вы проявляете", "дружбу"],
  };
  const family: Record<string, [string, string]> = {
    common_ground: ["Что вас объединяет и", "поддерживает"],
    differences: ["Где расходятся", "привычные реакции"],
    values_needs: ["Потребности, роли и", "границы"],
    mutual_expression: ["Как вы проявляете заботу и", "самостоятельность"],
  };
  const table = kind === "friendship" ? friendship : kind === "family" ? family : romantic;
  return table[id] || romantic[id] || ["", ""];
}

function topic(input: DeepTopic): DeepTopic {
  const seen = new Set<string>();
  return {
    ...input,
    insight: clean(input.insight),
    preview: clean(input.preview),
    paragraphs: (input.paragraphs || [])
      .map((paragraph) => ({ label: clean(paragraph.label), text: clean(paragraph.text) }))
      .filter((paragraph) => paragraph.text),
    glyphs: input.glyphs.filter((glyph) => {
      const key = `${glyph.pointA}${glyph.aspect}${glyph.pointB}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    astro: [...new Set(input.astro.map(clean).filter(Boolean))],
  };
}

function fillTopic(input: DeepTopic): DeepTopic {
  return {
    ...input,
    preview:
      input.preview ||
      (input.glyphs.length ? "" : "В этих картах отдельной связки под эту тему не нашлось."),
  };
}

function prose(aspects: SynastryAspect[]) {
  return aspects.find((aspect) => aspect.interpretation)?.interpretation || "";
}

function story(result: CompatibilityResult, id: BondSummaryCard["id"]) {
  return result.bondSummary.find((card) => card.id === id);
}

function bondText(result: CompatibilityResult, category: string) {
  return result.bonds.find((bond) => bond.category === category)?.insight || "";
}

function pick(aspects: SynastryAspect[], points: Set<string> | null, kinds: Set<string> | null) {
  return aspects.filter((aspect) => {
    const pointHit = !points || points.has(aspect.pointA) || points.has(aspect.pointB);
    const kindHit = !kinds || kinds.has(aspect.aspect);
    return pointHit && kindHit;
  });
}

function pairs(aspects: SynastryAspect[]): GlyphPair[] {
  return aspects.slice(0, 3).map((aspect) => ({
    id: aspect.id,
    pointA: aspect.pointA,
    aspect: aspect.aspect,
    pointB: aspect.pointB,
  }));
}

function lines(aspects: SynastryAspect[], names: Record<PersonId, string>) {
  return aspects.slice(0, 4).map((aspect) => {
    const left = PLANET_RU[aspect.pointA] || aspect.pointA;
    const right = PLANET_RU[aspect.pointB] || aspect.pointB;
    const name = ASPECT_RU[aspect.aspect] || aspect.aspect;
    return `${left} · ${names.A}, ${name}, ${right} · ${names.B}`;
  });
}

function signRows(result: CompatibilityResult, points: Set<string>) {
  return result.signComparisons.filter((row) => points.has(row.point));
}

function signText(result: CompatibilityResult, points: Set<string>) {
  return signRows(result, points)
    .map((row) => row.text)
    .filter(Boolean)
    .join(" ");
}

function signGlyphs(result: CompatibilityResult, points: Set<string>): GlyphPair[] {
  return signRows(result, points).slice(0, 3).map((row) => ({
    id: `sign-${row.id}`,
    pointA: row.point,
    aspect: "",
    pointB: "",
  }));
}

function signLines(result: CompatibilityResult, points: Set<string>, names: Record<PersonId, string>) {
  return signRows(result, points).map((row) => signLine(row, names));
}

function signLine(row: SignComparison, names: Record<PersonId, string>) {
  const planet = PLANET_RU[row.point] || row.title;
  return `${planet}: ${names.A} — ${row.a}, ${names.B} — ${row.b}.`;
}

function softReading(aspects: SynastryAspect[]) {
  return pick(aspects, NEAR, SOFT).find((aspect) => aspect.interpretation)?.interpretation || "";
}

function karmicReading(aspects: SynastryAspect[], names: Record<PersonId, string>) {
  const found = aspects.find((aspect) => KARMIC.has(aspect.pointA) || KARMIC.has(aspect.pointB));
  if (!found) return "";
  return found.interpretation || lines([found], names)[0] || "";
}

function plutoReading(aspects: SynastryAspect[]) {
  return aspects.find((aspect) => aspect.pointA === "pluto" || aspect.pointB === "pluto")?.interpretation || "";
}

function currentTension(result: CompatibilityResult) {
  const notes = result.cycles.active.map((cycle) => cycle.relationshipNote).filter(Boolean);
  return notes[0] || result.cycles.couple.text || "";
}

function cycleSlot(result: CompatibilityResult, personId: PersonId, name: string): ReadingCycle {
  const selected = result.cycleSlots?.find((item) => item.personId === personId);
  if (selected) {
    return { personId, name, title: selected.title, period: selected.period, text: selected.text };
  }
  const cycle = result.cycles.active.find((item) => item.personId === personId) ?? null;
  if (!cycle) {
    return {
      personId,
      name,
      title: "—",
      period: "",
      text: "Текущий период ещё не посчитан.",
    };
  }
  return {
    personId,
    name,
    title: cycle.title || "—",
    period: cycle.period,
    text: cycleText(cycle),
  };
}

function cycleText(cycle: PersonCycle) {
  return [cycle.relationshipNote, cycle.personalInsight].map(clean).filter(Boolean).join(" ");
}

function conclusionText(
  kind: RelationshipKind | null,
  stage: RelationshipStage | null,
  support: string | undefined,
  tension: string | undefined,
) {
  const lead =
    stage === "past"
      ? "Эта связь уже завершилась. Здесь не вердикт, а то, что в ней было самым заметным."
      : stage === "meeting"
        ? "Вы в начале знакомства. Потенциал здесь не обещание, а то, что уже видно по картам."
        : kind === "friendship"
          ? "В дружбе потенциал в том, на чём вам легко быть рядом и где разница характеров просит ясности."
          : kind === "family"
            ? "В семье потенциал в том, какие роли вам привычны рядом и где старые реакции начинают спорить."
            : "Вы уже в этих отношениях. Потенциал в том, как вы пользуетесь тем, что вас держит, и как говорите о том, что расходится.";
  const held = sentence(support);
  const strain = sentence(tension);
  const detail = [held ? `Что вас держит: ${held}` : "", strain ? `Где вы расходитесь: ${strain}` : ""]
    .filter(Boolean)
    .join(" ");
  return detail ? `${lead} ${detail}` : lead;
}

function uniqueText(title: string, ...parts: Array<string | undefined>) {
  const head = clean(title);
  return parts.map(clean).find((part) => part && part !== head) || "";
}

function sentence(value: string | undefined) {
  const text = clean(value);
  if (!text) return "";
  const match = text.match(/^[\s\S]{24,220}?[.!?…](?=\s|$)/);
  return match?.[0]?.trim() || text.slice(0, 220).trim();
}

function clean(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}
