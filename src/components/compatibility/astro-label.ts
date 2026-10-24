import { formatDms } from "@/lib/astro-glyphs";
import type { Placement } from "@/lib/compatibility/types";

const SIGN_RU: Record<string, string> = {
  aries: "Овен",
  taurus: "Телец",
  gemini: "Близнецы",
  cancer: "Рак",
  leo: "Лев",
  virgo: "Дева",
  libra: "Весы",
  scorpio: "Скорпион",
  sagittarius: "Стрелец",
  capricorn: "Козерог",
  aquarius: "Водолей",
  pisces: "Рыбы",
};

export function signLabel(sign: string) {
  return SIGN_RU[sign] ?? sign;
}

export function placementText(placement: Placement | null, missing = "Нужно время рождения") {
  if (!placement) return missing;
  if (placement.degree == null) return signLabel(placement.sign);
  const place = `${signLabel(placement.sign)} ${formatDms(placement.degree, placement.minute ?? 0)}`;
  return placement.retrograde ? `${place}\u00a0R` : place;
}
