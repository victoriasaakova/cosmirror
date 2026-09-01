"use client";

import {
  PLANET_RU,
  SIGN_KEYS,
  planetGlyph,
} from "@/lib/astro-glyphs";

export type SignsTablePoint = {
  key: string;
  name?: string;
  sign?: string;
  sign_ru?: string;
  house?: number | null;
  glyph?: string;
  degree?: number;
};

type SignGroup = {
  sign: string;
  signRu: string;
  rows: SignsTablePoint[];
  house: number | null;
  sharedHouse: boolean;
};

const PLANET_ORDER = [
  "ascendant",
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "north_node",
  "south_node",
  "chiron",
  "midheaven",
];

export function SignsTable({
  points,
  hasBirthTime,
}: {
  points?: SignsTablePoint[];
  hasBirthTime: boolean;
}) {
  const groups = groupBySign(points ?? [], hasBirthTime);
  if (groups.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-stretch gap-1.5">
        <p
          className="w-3 shrink-0 self-stretch text-center text-[0.55rem] uppercase leading-none tracking-[0.22em] text-white/40 [writing-mode:vertical-rl] rotate-180"
          aria-hidden
        >
          Знаки
        </p>
        <table className="min-w-0 flex-1 border-collapse text-left">
          <caption className="sr-only">Положения планет в знаках и домах</caption>
          <tbody>
            {groups.map((group) =>
              group.rows.map((point, index) => (
                <tr key={`${group.sign}-${point.key}`}>
                  {index === 0 ? (
                    <th
                      scope="row"
                      rowSpan={group.rows.length}
                      className="border border-white/25 px-2 py-1 align-middle font-display text-[0.8125rem] italic font-normal leading-tight text-white sm:px-2.5 sm:text-sm"
                    >
                      {group.signRu}
                    </th>
                  ) : null}
                  <td className="border border-white/25 px-2 py-1 align-middle sm:px-2.5">
                    <span className="flex items-center gap-1.5 text-[0.8125rem] leading-snug text-white sm:text-sm">
                      <span className="natal-astro-glyph text-[0.95rem] text-[#F6E7A1]" aria-hidden>
                        {planetGlyph(point.key, point.glyph)}
                      </span>
                      {planetName(point)}
                    </span>
                  </td>
                  {hasBirthTime && (!group.sharedHouse || index === 0) ? (
                    <td
                      rowSpan={group.sharedHouse ? group.rows.length : 1}
                      className="w-8 border border-white/25 px-1.5 py-1 text-center align-middle sm:w-9"
                    >
                      {point.house ? (
                        <span className="text-[0.8125rem] tabular-nums leading-none text-white/80 sm:text-sm">
                          {point.house}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )),
            )}
          </tbody>
        </table>
        {hasBirthTime ? (
          <p
            className="w-3 shrink-0 self-stretch text-center text-[0.55rem] uppercase leading-none tracking-[0.22em] text-white/40 [writing-mode:vertical-rl] rotate-180"
            aria-hidden
          >
            Дома
          </p>
        ) : null}
      </div>
    </div>
  );
}

function planetName(point: SignsTablePoint): string {
  return point.name || PLANET_RU[point.key] || point.key;
}

function signIndexOf(point: SignsTablePoint): number {
  const key = (point.sign || "").toLowerCase();
  return SIGN_KEYS.indexOf(key as (typeof SIGN_KEYS)[number]);
}

function groupBySign(points: SignsTablePoint[], hasBirthTime: boolean): SignGroup[] {
  const buckets = new Map<number, { signRu: string; rows: SignsTablePoint[] }>();
  for (const point of points) {
    const index = signIndexOf(point);
    if (index < 0) continue;
    const current = buckets.get(index) ?? {
      signRu: point.sign_ru || SIGN_KEYS[index],
      rows: [],
    };
    if (!current.rows.some((row) => row.key === point.key)) {
      current.rows.push(point);
    }
    if (point.sign_ru) current.signRu = point.sign_ru;
    buckets.set(index, current);
  }

  const rising = points.find((point) => point.key === "ascendant");
  const start = rising ? Math.max(0, signIndexOf(rising)) : 0;
  const order = Array.from({ length: 12 }, (_, offset) => (start + offset) % 12);

  return order.flatMap((index) => {
    const bucket = buckets.get(index);
    if (!bucket) return [];
    const rows = [...bucket.rows].sort(comparePlanets);
    const houses = rows.map((row) => (hasBirthTime ? row.house ?? null : null));
    const firstHouse = houses[0] ?? null;
    const sharedHouse =
      hasBirthTime && firstHouse !== null && houses.every((house) => house === firstHouse);
    return [
      {
        sign: SIGN_KEYS[index],
        signRu: bucket.signRu,
        rows,
        house: firstHouse,
        sharedHouse,
      },
    ];
  });
}

function comparePlanets(a: SignsTablePoint, b: SignsTablePoint): number {
  const orderA = PLANET_ORDER.indexOf(a.key);
  const orderB = PLANET_ORDER.indexOf(b.key);
  const rankA = orderA === -1 ? 50 : orderA;
  const rankB = orderB === -1 ? 50 : orderB;
  if (rankA !== rankB) return rankA - rankB;
  return (a.degree ?? 0) - (b.degree ?? 0);
}
