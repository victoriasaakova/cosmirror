const VS15 = "\uFE0E";

export const ZODIAC_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"] as const;

export const SIGN_KEYS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export function signGlyph(sign?: string, signIndex?: number): string {
  const fromIndex = typeof signIndex === "number" ? signIndex : -1;
  const fromKey = sign ? SIGN_KEYS.indexOf(sign.toLowerCase() as (typeof SIGN_KEYS)[number]) : -1;
  const index = fromIndex >= 0 && fromIndex <= 11 ? fromIndex : fromKey;
  if (index < 0 || index > 11) return "";
  return `${ZODIAC_GLYPH[index]}${VS15}`;
}

export function formatDms(degree?: number, minute?: number): string {
  if (typeof degree !== "number" || Number.isNaN(degree)) return "";
  return `${Math.trunc(degree)}°${String(minute ?? 0).padStart(2, "0")}′`;
}

export const PLANET_GLYPH: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  north_node: "☊",
  south_node: "☋",
  chiron: "⚷",
  vesta: "⚶",
  ascendant: "Asc",
  midheaven: "MC",
};

export const ASPECT_GLYPH: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "⚹",
  quincunx: "⚻",
};

function textGlyph(raw?: string): string {
  const value = (raw || "").trim();
  if (!value) return "";
  return value.endsWith(VS15) ? value : `${value}${VS15}`;
}

export function planetGlyph(key?: string, fallback?: string): string {
  if (!key && !fallback) return "";
  const fromKey = key ? PLANET_GLYPH[key] : "";
  return textGlyph(fromKey || fallback);
}

export function aspectGlyph(aspect?: string): string {
  if (!aspect) return "";
  return textGlyph(ASPECT_GLYPH[aspect] || "");
}

export const PLANET_RU: Record<string, string> = {
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
  vesta: "Веста",
  ascendant: "Асцендент",
  midheaven: "Середина неба",
  descendant: "Десцендент",
  ic: "Надир",
};

export const ASPECT_RU: Record<string, string> = {
  conjunction: "соединение",
  opposition: "оппозиция",
  square: "квадрат",
  trine: "тригон",
  sextile: "секстиль",
  quincunx: "квинконс",
};

export type AstroPair = {
  left: string;
  aspect: string;
  right: string;
};

const BODY_KEYS = [
  "north_node",
  "south_node",
  "midheaven",
  "ascendant",
  "descendant",
  "mercury",
  "jupiter",
  "neptune",
  "saturn",
  "uranus",
  "chiron",
  "vesta",
  "pluto",
  "venus",
  "mars",
  "moon",
  "sun",
  "ic",
];

const ASPECT_KEYS = ["conjunction", "opposition", "quincunx", "sextile", "square", "trine"];

function aliasBody(token?: string): string {
  if (token === "asc") return "ascendant";
  if (token === "mc") return "midheaven";
  if (token === "ds") return "descendant";
  return token || "";
}

function takeKeyed(parts: string[], keys: string[], alias?: (token: string) => string): [string, string[]] {
  if (!parts.length) return ["", parts];
  const first = alias ? alias(parts[0]) : parts[0];
  const shifted = first !== parts[0] ? [first, ...parts.slice(1)] : parts;
  for (const key of keys) {
    const tokens = key.split("_");
    if (shifted.slice(0, tokens.length).join("_") === key) {
      return [key, shifted.slice(tokens.length)];
    }
  }
  return ["", parts];
}

export function parseAstroPairId(raw?: string): AstroPair | null {
  if (!raw) return null;
  let parts = raw.toLowerCase().replace(/-/g, "_").split("_").filter(Boolean);
  if (parts[0] === "t" || parts[0] === "natal") parts = parts.slice(1);
  const [left, rest] = takeKeyed(parts, BODY_KEYS, aliasBody);
  if (!left) return null;
  const [aspect, tail] = takeKeyed(rest, ASPECT_KEYS);
  if (!aspect) return null;
  const [right] = takeKeyed(tail, BODY_KEYS, aliasBody);
  if (!right) return null;
  return { left, aspect, right };
}

export function planetRu(key?: string): string {
  if (!key) return "";
  return PLANET_RU[key] || "";
}

export function aspectRu(key?: string): string {
  if (!key) return "";
  return ASPECT_RU[key] || "";
}

export function astroPairLabel(pair: AstroPair, names?: { left?: string; aspect?: string; right?: string }): string {
  return [
    names?.left || planetRu(pair.left),
    names?.aspect || aspectRu(pair.aspect),
    names?.right || planetRu(pair.right),
  ]
    .filter(Boolean)
    .join(" ");
}
