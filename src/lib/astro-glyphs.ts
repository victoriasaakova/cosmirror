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
