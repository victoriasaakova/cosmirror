"use client";

import {
  PLANET_RU,
  SIGN_KEYS,
  planetGlyph,
  signGlyph,
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

  const lastCol = hasBirthTime ? 2 : 1;
  const headerClass = (col: number) =>
    `px-2 py-1.5 text-[0.8125rem] font-normal leading-snug text-white/80 sm:px-2.5 sm:text-sm${gridBorders({ col, lastCol, rowEnd: false })}`;

  return (
    <div className="mt-6 rounded-xl border border-white/25">
      <table className="w-full min-w-0 border-collapse text-left">
        <caption className="sr-only">Положения планет в знаках и домах</caption>
        <thead>
          <tr>
            <th scope="col" className={headerClass(0)}>
              Знаки
            </th>
            <th scope="col" className={headerClass(1)}>
              Планеты
            </th>
            {hasBirthTime ? (
              <th scope="col" className={`${headerClass(2)} w-11 px-1.5 text-center sm:w-12`}>
                Дома
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIndex) => {
            const lastGroup = groupIndex === groups.length - 1;
            return group.rows.map((point, index) => (
              <tr key={`${group.sign}-${point.key}`}>
                {index === 0 ? (
                  <th
                    scope="row"
                    rowSpan={group.rows.length}
                    className={`px-2 py-1 align-middle font-normal sm:px-2.5${gridBorders({ col: 0, lastCol, rowEnd: lastGroup })}`}
                  >
                    <span className="flex items-center gap-1.5 text-[0.8125rem] leading-snug text-white sm:text-sm">
                      <span className="natal-astro-glyph text-[0.95rem] text-[#F6E7A1]" aria-hidden>
                        {signGlyph(group.sign)}
                      </span>
                      {group.signRu}
                    </span>
                  </th>
                ) : null}
                <td
                  className={`px-2 py-1 align-middle sm:px-2.5${gridBorders({
                    col: 1,
                    lastCol,
                    rowEnd: lastGroup && index === group.rows.length - 1,
                  })}`}
                >
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
                    className={`w-11 px-1.5 py-1 text-center align-middle sm:w-12${gridBorders({
                      col: 2,
                      lastCol,
                      rowEnd: group.sharedHouse ? lastGroup : lastGroup && index === group.rows.length - 1,
                    })}`}
                  >
                    {point.house ? (
                      <span className="font-display text-[0.8125rem] italic font-normal tabular-nums leading-none text-[#F6E7A1] sm:text-sm">
                        {point.house}
                      </span>
                    ) : (
                      <span className="text-xs text-white/80">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

function gridBorders({
  col,
  lastCol,
  rowEnd,
}: {
  col: number;
  lastCol: number;
  rowEnd: boolean;
}): string {
  return `${col < lastCol ? " border-r border-white/25" : ""}${rowEnd ? "" : " border-b border-white/25"}`;
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
