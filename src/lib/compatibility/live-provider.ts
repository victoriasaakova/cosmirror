import { createCompatibilityReport } from "@/lib/api";
import { signLabel } from "@/components/compatibility/astro-label";
import type {
  AspectKey,
  AspectPoint,
  BondCard,
  BondSummaryCard,
  CompatibilityRequest,
  CompatibilityResult,
  CompatibilityScores,
  ScoreIndex,
  ScoreStatus,
  NatalRow,
  PairArcanaPerson,
  PairTarotCard,
  PairTarotLove,
  PersonId,
  Placement,
  PointKey,
  TarotArcana,
  SignComparison,
  SynastryAspect,
} from "@/lib/compatibility/types";

const BODY_RU: Record<string, string> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
  uranus: "Уран",
  neptune: "Нептун",
  pluto: "Плутон",
  north_node: "Северный узел",
  south_node: "Южный узел",
  chiron: "Хирон",
  asc: "Асцендент",
  mc: "MC",
};

const DATIVE: Record<string, string> = {
  sun: "Солнцу",
  moon: "Луне",
  mercury: "Меркурию",
  venus: "Венере",
  mars: "Марсу",
  jupiter: "Юпитеру",
  saturn: "Сатурну",
  uranus: "Урану",
  neptune: "Нептуну",
  pluto: "Плутону",
  north_node: "Северному узлу",
  south_node: "Южному узлу",
  asc: "Асценденту",
  mc: "середине неба",
};

const INSTRUMENTAL: Record<string, string> = {
  sun: "Солнцем",
  moon: "Луной",
  mercury: "Меркурием",
  venus: "Венерой",
  mars: "Марсом",
  jupiter: "Юпитером",
  saturn: "Сатурном",
  uranus: "Ураном",
  neptune: "Нептуном",
  pluto: "Плутоном",
  north_node: "Северным узлом",
  south_node: "Южным узлом",
  asc: "Асцендентом",
  mc: "серединой неба",
};

const ASPECT_PHRASE: Record<string, string> = {
  conjunction: "в соединении с {other}",
  sextile: "в секстиле к {other}",
  square: "в квадрате к {other}",
  trine: "в тригоне к {other}",
  opposition: "в оппозиции к {other}",
};

const CATEGORY_RU: Record<string, string> = {
  life_changing: "Связка, которая может сдвигать привычное",
  amazing: "То, что между вами легче поддерживается",
  attraction: "Интерес и ответное движение",
  notables: "Заметная связь",
  frustration: "Разница ритма",
  trials: "Тема усилия и предела",
};

const SIGN_TITLE: Record<string, string> = {
  sun: "Самовыражение",
  moon: "Эмоциональные потребности",
  mercury: "Общение",
  venus: "Близость и ценности",
  mars: "Инициатива и конфликты",
  asc: "Как вы проявляетесь",
};

const NATAL_POINTS: PointKey[] = ["sun", "moon", "mercury", "venus", "mars", "ascendant"];

const STORY_IMAGE: Record<BondSummaryCard["id"], string> = {
  dynamic: "/images/cosmoportrait.webp",
  attraction: "/images/landscape_stars.webp",
  support: "/images/landscape_natal_map_2.webp",
  tension: "/images/hero-coastal-moon-trail_4.webp",
  care: "/images/report.webp",
};

type ApiAspect = {
  id: string;
  person_a_point: string;
  person_b_point: string;
  aspect: string;
  orb_deg: number;
  normalized_closeness?: number;
  direction: string;
  sign_a?: string;
  sign_b?: string;
};

type ApiInsight = {
  id: string;
  category: string;
  evidence_ids: string[];
  eyebrow: string;
  title: string;
  snapshot: string;
  summary: string;
  deep_read: string;
  share_text?: string;
};

type ApiPosition = {
  body: string;
  sign?: string;
  longitude?: number;
};

type ApiDocument = {
  schema_version: string;
  persons: { id: PersonId; display_name: string; birth_time_status: "known" | "approximate" | "unknown" }[];
  bond: {
    strongest_connection_id?: string | null;
    biggest_challenge_id?: string | null;
    insights?: ApiInsight[];
  };
  transits?: { status?: string };
  signs?: {
    comparisons?: {
      point: string;
      pair_placements?: { A?: { sign?: string }; B?: { sign?: string } };
      meaning?: string;
      difference?: string;
    }[];
  };
  chart: {
    positions: { A: ApiPosition[]; B: ApiPosition[] };
    cross_aspects: ApiAspect[];
    overlays?: { A_in_B?: { body: string; house: number }[]; B_in_A?: { body: string; house: number }[] };
  };
  meta?: { data_quality?: string; warnings?: string[] };
  insight?: {
    status?: string;
    temporal_frame?: string;
    title?: string;
    body?: string;
    basis?: string;
  };
  pair_card?: {
    status?: string;
    formula_note?: string;
    card?: { number?: number; name?: string; image?: string };
    persons?: { id?: string; number?: number; name?: string }[];
    love?: { name?: string; upright?: string; reversed?: string };
  };
  scoring?: {
    harmony?: ApiScore;
    karmic_patterns?: ApiScore;
    current_tension?: ApiScore;
    transformation?: ApiScore;
  };
  deep_dive?: {
    sections?: ApiDeepSection[];
    conclusion?: {
      headline?: string | null;
      body?: string | null;
      summary?: string | null;
      potential_or_meaning?: string | null;
      conditions_or_limits?: string | null;
    };
  };
  active_cycles?: {
    persons?: {
      A?: ApiCycle;
      B?: ApiCycle;
    };
  };
};

type ApiDeepSection = {
  id?: string;
  section_title?: string;
  headline?: string | null;
  body?: string | null;
  preview?: string | null;
  evidence_ids?: string[];
  primary_evidence_id?: string | null;
  astro_basis?: { cross_evidence_ids?: string[] };
};

type ApiCycle = {
  status?: string;
  interpretation?: {
    headline?: string;
    body?: string;
    teaser?: string;
    focus?: string;
    sensitive_point?: string;
    need?: string;
    resource?: string;
    relationship_lens?: string;
    astrological_basis_ru?: string;
  } | null;
};

type ApiScore = {
  value?: number | null;
  status?: string;
  summary?: string;
};

export async function loadLiveCompatibility(request: CompatibilityRequest): Promise<CompatibilityResult> {
  const document = (await createCompatibilityReport(toApiBody(request))) as ApiDocument;
  return toResult(document);
}

function toApiBody(request: CompatibilityRequest) {
  return {
    relationship_type: request.relationshipType,
    relationship_status: request.relationshipStatus,
    persons: request.persons.map((person) => ({
      person_id: person.id,
      display_name: person.displayName,
      birth_date: person.birthDate,
      birth_time: person.birthTime,
      birth_time_status: person.birthTimeStatus,
      place_name: person.placeName,
      latitude: person.latitude,
      longitude: person.longitude,
      timezone_id: person.timezone,
    })),
  };
}

function toResult(document: ApiDocument): CompatibilityResult {
  const names = {
    A: document.persons.find((person) => person.id === "A")?.display_name || "Ты",
    B: document.persons.find((person) => person.id === "B")?.display_name || "Партнёр",
  };
  const aspects = (document.chart.cross_aspects || [])
    .filter((row) => row.direction === "A_to_B")
    .sort((left, right) => (right.normalized_closeness ?? 0) - (left.normalized_closeness ?? 0));
  const insights = document.bond.insights || [];
  const byId = new Map(aspects.map((row) => [row.id, row]));
  const bonds = insights.map((insight) => toBond(insight, names, byId));
  const bondSummary = toStories(document.bond, insights, names, byId);
  const insightIds = new Set(insights.flatMap((insight) => insight.evidence_ids));
  const readable = aspects.filter((row) => insightIds.has(row.id));
  const quiet = aspects.filter((row) => !insightIds.has(row.id));
  const orderedAspects = [...readable, ...quiet];
  const primaryCount = Math.min(8, readable.length || orderedAspects.length);

  return {
    schemaVersion: document.schema_version === "compatibility-v2" ? "compatibility-v2" : "compatibility-v1",
    source: "api",
    dataQuality: document.meta?.data_quality === "full" ? "full" : "partial",
    warnings: timeNotes(document.persons),
    persons: [
      {
        id: "A",
        displayName: names.A,
        birthTimeStatus: personStatus(document.persons.find((person) => person.id === "A")?.birth_time_status),
        placements: [],
      },
      {
        id: "B",
        displayName: names.B,
        birthTimeStatus: personStatus(document.persons.find((person) => person.id === "B")?.birth_time_status),
        placements: [],
      },
    ],
    insight: toInsight(document.insight),
    pairCard: toPairCard(document.pair_card),
    scores: toScores(document.scoring),
    deepSections: toDeepSections(document, names),
    readingConclusion: toConclusion(document.deep_dive?.conclusion),
    cycleSlots: toCycleSlots(document.active_cycles),
    overview: {
      title: relationshipLine(document.bond, insights),
      summary: "",
      observations: [],
    },
    bondSummary,
    bonds,
    signComparisons: toSigns(document),
    dimensions: [],
    cycles: {
      background: "",
      active: [],
      couple: { title: "", text: "" },
      upcoming: [],
    },
    natalRows: toNatalRows(document.chart.positions),
    aspects: orderedAspects.map((row, index) => toAspect(row, index < primaryCount, insights, names)),
    houseOverlays: toHouses(document.chart.overlays, names),
    reflection: { question: "", conclusion: "" },
  };
}

const PAIR_CARD_NOTE = "Это выбранная формула Cosmirror, а не универсальное правило Таро.";
const TAROT_IMAGE = /^\/images\/tarot\/ar(?:0\d|1\d|2[01])\.jpg$/;

function toPairCard(raw: ApiDocument["pair_card"]): PairTarotCard | undefined {
  if (!raw || raw.status !== "ready") return undefined;
  const card = toArcana(raw.card);
  if (!card) return undefined;
  const note = raw.formula_note?.trim();
  const love = toLove(raw.love);
  return {
    formulaNote: note || PAIR_CARD_NOTE,
    card,
    persons: toPairPersons(raw.persons),
    ...(love ? { love } : {}),
  };
}

function toLove(raw: { name?: string; upright?: string; reversed?: string } | undefined): PairTarotLove | undefined {
  const name = raw?.name?.trim() ?? "";
  const upright = raw?.upright?.trim() ?? "";
  const reversed = raw?.reversed?.trim() ?? "";
  if (!name || !upright || !reversed) return undefined;
  if (name.length > 80 || upright.length > 240 || reversed.length > 240) return undefined;
  return { name, upright, reversed };
}

function toPairPersons(raw: { id?: string; number?: number; name?: string }[] | undefined): PairArcanaPerson[] {
  if (!Array.isArray(raw)) return [];
  const people: PairArcanaPerson[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const id = row?.id;
    const number = row?.number;
    const name = row?.name?.trim() ?? "";
    if ((id !== "A" && id !== "B") || seen.has(id)) continue;
    if (typeof number !== "number" || !Number.isInteger(number) || number < 1 || number > 22) continue;
    if (!name || name.length > 40) continue;
    seen.add(id);
    people.push({ id, number, name });
  }
  return people.sort((left, right) => (left.id < right.id ? -1 : 1));
}

function toArcana(raw: { number?: number; name?: string; image?: string } | undefined): TarotArcana | undefined {
  const number = raw?.number;
  if (!raw || typeof number !== "number" || !Number.isInteger(number) || number < 1 || number > 22) {
    return undefined;
  }
  const name = raw.name?.trim() ?? "";
  const image = raw.image ?? "";
  if (!name || name.length > 40 || !TAROT_IMAGE.test(image)) return undefined;
  return { number, name, image };
}

function toScores(scoring: ApiDocument["scoring"]): CompatibilityScores | undefined {
  if (!scoring) return undefined;
  const harmony = toScore(scoring.harmony);
  const karmic = toScore(scoring.karmic_patterns);
  const currentTension = toScore(scoring.current_tension);
  const transformation = toScore(scoring.transformation);
  if (!harmony || !karmic || !currentTension || !transformation) return undefined;
  return { harmony, karmic, currentTension, transformation };
}

function toScore(row: ApiScore | undefined): ScoreIndex | undefined {
  if (!row || !isScoreStatus(row.status)) return undefined;
  const value = typeof row.value === "number" && Number.isFinite(row.value) ? Math.round(row.value) : null;
  return { value, status: row.status, summary: row.summary || "" };
}

function isScoreStatus(status: string | undefined): status is ScoreStatus {
  return status === "ready" || status === "limited" || status === "pending" || status === "unavailable" || status === "error";
}

function toDeepSections(document: ApiDocument, names: Record<PersonId, string>): CompatibilityResult["deepSections"] {
  const sections = document.deep_dive?.sections;
  if (!sections?.length) return undefined;
  const aspects = new Map((document.chart.cross_aspects || []).map((row) => [row.id, row]));
  return sections.map((section) => {
    const evidenceIds = section.evidence_ids?.length
      ? section.evidence_ids
      : section.astro_basis?.cross_evidence_ids?.length
        ? section.astro_basis.cross_evidence_ids
        : section.primary_evidence_id
          ? [section.primary_evidence_id]
          : [];
    const evidence = evidenceIds.map((id) => aspects.get(id)).filter((row): row is ApiAspect => Boolean(row));
    const paragraphs = bodyParagraphs(section.body);
    return {
      id: section.id || "section",
      title: section.headline || "",
      teaser: paragraphs.length ? "" : section.preview || "",
      paragraphs,
      aspectLines: evidence.map((row) => aspectLine(row, names)),
      glyphs: evidence.slice(0, 3).map((row) => ({
        id: row.id,
        pointA: row.person_a_point,
        aspect: row.aspect,
        pointB: row.person_b_point,
      })),
    };
  });
}

function bodyParagraphs(body: string | null | undefined): { label: string; text: string }[] {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((text) => ({ label: "", text }));
}

function toConclusion(row: NonNullable<ApiDocument["deep_dive"]>["conclusion"]): CompatibilityResult["readingConclusion"] {
  if (!row) return undefined;
  const text = row.body || [row.summary, row.potential_or_meaning, row.conditions_or_limits].filter(Boolean).join("\n\n");
  if (!row.headline && !text) return undefined;
  return { headline: row.headline || "Главное о вашей связи", text };
}

function toCycleSlots(cycles: ApiDocument["active_cycles"]): CompatibilityResult["cycleSlots"] {
  const persons = cycles?.persons;
  if (!persons) return undefined;
  return (["A", "B"] as PersonId[]).map((personId) => {
    const row = persons[personId];
    const text = row?.interpretation;
    if (!text || row?.status !== "ready") {
      return {
        personId,
        title: "—",
        period: "",
        text: "Сейчас нет отдельного значимого цикла по выбранным критериям.",
      };
    }
    const prose = text.body
      || [text.teaser, text.focus, text.sensitive_point, text.need, text.resource, text.relationship_lens]
        .filter(Boolean)
        .join(" ");
    return {
      personId,
      title: text.headline || "—",
      period: text.astrological_basis_ru || "",
      text: prose,
    };
  });
}

function toInsight(row: ApiDocument["insight"]): CompatibilityResult["insight"] {
  if (!row || (row.status !== "ready" && row.status !== "unavailable")) return undefined;
  return {
    status: row.status,
    temporalFrame: row.temporal_frame === "current" ? "current" : "base",
    title: row.title || "",
    body: row.body || "",
    basis: row.basis || "",
  };
}

function toBond(insight: ApiInsight, names: Record<PersonId, string>, byId: Map<string, ApiAspect>): BondCard {
  const aspect = insight.evidence_ids.map((id) => byId.get(id)).find(Boolean);
  const aspectText = aspect ? aspectLine(aspect, names) : humanize(insight.eyebrow, names);
  const title = meaningTitle(insight, names);
  const orb = aspect ? `Орб ${formatOrb(aspect.orb_deg)}.` : "";
  return {
    id: insight.id,
    category: CATEGORY_RU[insight.category] || insight.category,
    headline: title || aspectText,
    insight: humanize(insight.summary, names),
    basis: [title ? aspectText : "", humanize(insight.deep_read, names), orb].filter(Boolean).join(" "),
  };
}

function toStories(
  bond: ApiDocument["bond"],
  insights: ApiInsight[],
  names: Record<PersonId, string>,
  byId: Map<string, ApiAspect>,
): BondSummaryCard[] {
  const used = new Set<string>();
  const cards: BondSummaryCard[] = [];
  const take = (id: BondSummaryCard["id"], role: string, match: (insight: ApiInsight) => boolean) => {
    const insight = insights.find((item) => !used.has(item.id) && match(item));
    if (!insight) return;
    used.add(insight.id);
    cards.push({
      id,
      role,
      headline: meaningTitle(insight, names) || (aspectHeadline(insight, names, byId)),
      text: humanize(insight.summary, names),
      image: STORY_IMAGE[id],
    });
  };
  const hasEvidence = (id: string | null | undefined) => (insight: ApiInsight) =>
    Boolean(id) && insight.evidence_ids.includes(id as string);
  take("dynamic", "Общая динамика", hasEvidence(bond.strongest_connection_id));
  if (!cards.some((card) => card.id === "dynamic")) take("dynamic", "Общая динамика", () => true);
  take("attraction", "Что вас притягивает", (insight) => insight.category === "attraction");
  take("support", "На что можно опереться", (insight) => insight.category === "amazing");
  if (!cards.some((card) => card.id === "support")) {
    take("support", "На что можно опереться", (insight) => insight.category === "notables");
  }
  take("tension", "Где возникает напряжение", hasEvidence(bond.biggest_challenge_id));
  if (!cards.some((card) => card.id === "tension")) {
    take("tension", "Где возникает напряжение", (insight) => insight.category === "frustration");
  }
  take("care", "Что важно учитывать", (insight) => insight.category === "trials");
  if (!cards.some((card) => card.id === "care")) {
    take("care", "Что важно учитывать", (insight) => insight.category === "life_changing");
  }
  return cards;
}

function toSigns(document: ApiDocument): SignComparison[] {
  return (document.signs?.comparisons || [])
    .filter((row) => SIGN_TITLE[row.point])
    .map((row) => {
      const aSign = row.pair_placements?.A?.sign || "";
      const bSign = row.pair_placements?.B?.sign || "";
      return {
        id: row.point,
        title: SIGN_TITLE[row.point],
        point: row.point === "asc" ? "ascendant" : (row.point as PointKey),
        aSign,
        bSign,
        a: signLabel(aSign),
        b: signLabel(bSign),
        text: [row.meaning, row.difference].filter(Boolean).join(" "),
      };
    });
}

function relationshipLine(bond: ApiDocument["bond"], insights: ApiInsight[]) {
  const id = bond.strongest_connection_id;
  const insight = insights.find((item) => Boolean(id) && item.evidence_ids.includes(id as string));
  const title = insight?.title?.trim() || "";
  if (title) return title;
  const share = insight?.share_text?.trim() || "";
  if (!share || share === "Между вами есть эта связка. Её можно проверить на вашем опыте.") return "";
  return share;
}

function toNatalRows(positions: ApiDocument["chart"]["positions"]): NatalRow[] {
  return NATAL_POINTS.map((point) => ({
    point,
    a: placementOf(positions.A, point),
    b: placementOf(positions.B, point),
  }));
}

function placementOf(rows: ApiPosition[] | undefined, point: PointKey): Placement | null {
  const body = point === "ascendant" ? "asc" : point;
  const row = (rows || []).find((item) => item.body === body);
  if (!row?.sign || typeof row.longitude !== "number") return null;
  const inSign = ((row.longitude % 30) + 30) % 30;
  let degree = Math.floor(inSign);
  let minute = Math.round((inSign - degree) * 60);
  if (minute === 60) {
    degree += 1;
    minute = 0;
  }
  if (degree === 30) {
    degree = 0;
  }
  return { point, sign: row.sign, degree, minute };
}

function toAspect(row: ApiAspect, primary: boolean, insights: ApiInsight[], names: Record<PersonId, string>): SynastryAspect {
  const insight = insights.find((item) => item.evidence_ids.includes(row.id));
  return {
    id: row.id,
    pointA: chartPoint(row.person_a_point),
    aspect: row.aspect as AspectKey,
    pointB: chartPoint(row.person_b_point),
    orbLabel: formatOrb(row.orb_deg),
    interpretation: insight ? humanize(insight.summary, names) : "",
    primary,
    requiresTime: null,
  };
}

function personStatus(status: string | undefined): "known" | "unknown" {
  return status === "known" ? "known" : "unknown";
}

function toHouses(
  overlays: ApiDocument["chart"]["overlays"],
  names: Record<PersonId, string>,
): string[] {
  const lines: string[] = [];
  for (const row of overlays?.A_in_B || []) {
    lines.push(houseLine(row.body, names.A, row.house, names.B));
  }
  for (const row of overlays?.B_in_A || []) {
    lines.push(houseLine(row.body, names.B, row.house, names.A));
  }
  return lines;
}

function houseLine(body: string, owner: string, house: number, host: string) {
  const label = BODY_RU[body] || body;
  return `${label} · ${owner} в ${house}-м доме · ${host}`;
}

function chartPoint(body: string): AspectPoint {
  if (body === "asc") return "ascendant";
  if (body === "mc") return "midheaven";
  return body as AspectPoint;
}

function timeNotes(persons: ApiDocument["persons"]) {
  return persons.flatMap((person) => {
    const name = person.display_name || (person.id === "A" ? "Ты" : "Партнёр");
    if (person.birth_time_status === "unknown") {
      return [`Время рождения ${name} неизвестно: углы, дома и аспекты Луны в разборе не используются.`];
    }
    if (person.birth_time_status === "approximate") {
      return [`Время рождения ${name} приблизительное: углы и дома в разборе не используются.`];
    }
    return [];
  });
}

function meaningTitle(insight: ApiInsight, names: Record<PersonId, string>) {
  const title = humanize(insight.title || "", names).trim();
  const category = CATEGORY_RU[insight.category] || "";
  if (!title || title === category) return "";
  return title;
}

function aspectHeadline(insight: ApiInsight, names: Record<PersonId, string>, byId: Map<string, ApiAspect>) {
  const aspect = insight.evidence_ids.map((id) => byId.get(id)).find(Boolean);
  return aspect ? aspectLine(aspect, names) : humanize(insight.eyebrow, names);
}

function aspectLine(row: ApiAspect, names: Record<PersonId, string>) {
  const left = BODY_RU[row.person_a_point] || row.person_a_point;
  const other = row.aspect === "conjunction" ? INSTRUMENTAL[row.person_b_point] : DATIVE[row.person_b_point];
  const phrase = ASPECT_PHRASE[row.aspect] || `в аспекте к ${other || row.person_b_point}`;
  const planet = phrase.replace("{other}", other || BODY_RU[row.person_b_point] || row.person_b_point);
  return `${left} у ${genitiveName(names.A)} ${planet} у ${genitiveName(names.B)}`;
}

function genitiveName(name: string) {
  const word = name.trim();
  if (word.toLowerCase() === "ты") return "тебя";
  if (!word || word.includes(" ")) return word;
  const lower = word.toLowerCase();
  if (/(ша|ча|жа|ща)$/.test(lower)) return `${word.slice(0, -1)}и`;
  if (lower.endsWith("а")) return `${word.slice(0, -1)}ы`;
  if (lower.endsWith("я")) return `${word.slice(0, -1)}и`;
  if (lower.endsWith("й") || lower.endsWith("ь")) return `${word.slice(0, -1)}я`;
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(lower)) return `${word}а`;
  return word;
}

function humanize(text: string, names: Record<PersonId, string>) {
  return text
    .replace(/ A\b/g, ` · ${names.A}`)
    .replace(/ B\b/g, ` · ${names.B}`)
    .replace("образуют оппозиция", "образуют оппозицию");
}

function formatOrb(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}°`;
}
