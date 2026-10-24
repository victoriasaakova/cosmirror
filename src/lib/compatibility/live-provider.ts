import { createCompatibilityReport } from "@/lib/api";
import { signLabel } from "@/components/compatibility/astro-label";
import type {
  AspectKey,
  AspectPoint,
  BondCard,
  BondSummaryCard,
  CompatibilityRequest,
  CompatibilityResult,
  NatalRow,
  PersonId,
  Placement,
  PointKey,
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

const ASPECT_RU: Record<string, string> = {
  conjunction: "соединение",
  sextile: "секстиль",
  square: "квадрат",
  trine: "тригон",
  opposition: "оппозиция",
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
};

export async function loadLiveCompatibility(request: CompatibilityRequest): Promise<CompatibilityResult> {
  const document = (await createCompatibilityReport(toApiBody(request))) as ApiDocument;
  return toResult(document);
}

function toApiBody(request: CompatibilityRequest) {
  return {
    relationship_type: request.relationshipType,
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
    schemaVersion: "compatibility-v1",
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
  const right = BODY_RU[row.person_b_point] || row.person_b_point;
  const name = ASPECT_RU[row.aspect] || row.aspect;
  return `${left} · ${names.A}, ${name}, ${right} · ${names.B}`;
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
