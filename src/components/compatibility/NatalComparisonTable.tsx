import { Fragment } from "react";
import { PLANET_RU, planetGlyph, signGlyph } from "@/lib/astro-glyphs";
import { signLabel } from "@/components/compatibility/astro-label";
import type { NatalRow, PersonId, Placement } from "@/lib/compatibility/types";

export function NatalComparisonTable({
  rows,
  names,
}: {
  rows: NatalRow[];
  names: Record<PersonId, string>;
}) {
  const visible = rows.filter((row) => row.a?.sign || row.b?.sign);
  if (visible.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-white/25">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Сравнение положений двух карт</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-1/2 border-b border-r border-white/25 px-3 py-2.5 text-center text-sm font-normal text-white/80 sm:px-4"
            >
              {names.A}
            </th>
            <th
              scope="col"
              className="w-1/2 border-b border-white/25 px-3 py-2.5 text-center text-sm font-normal text-white/80 sm:px-4"
            >
              {names.B}
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => {
            const last = index === visible.length - 1;
            const compared = Boolean(row.a?.sign && row.b?.sign);
            return (
              <Fragment key={row.point}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={2}
                    className="border-b border-white/25 bg-white/[0.04] px-3 py-1.5 text-center text-sm font-normal text-white"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span className="natal-astro-glyph text-base text-[#F6E7A1]" aria-hidden>
                        {planetGlyph(row.point)}
                      </span>
                      {PLANET_RU[row.point] ?? row.point}
                    </span>
                  </th>
                </tr>
                <tr>
                  <td className={cellClass(true, last)}>
                    <SignSide placement={row.a} arrow={compared} />
                  </td>
                  <td className={cellClass(false, last)}>
                    <SignSide placement={row.b} />
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function cellClass(leading: boolean, last: boolean) {
  return `px-3 py-2.5 align-middle sm:px-4${leading ? " border-r border-white/25" : ""}${
    last ? "" : " border-b border-white/25"
  }`;
}

function SignSide({ placement, arrow = false }: { placement: Placement | null; arrow?: boolean }) {
  if (!placement?.sign) {
    return <span className="text-sm text-white/45">—</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-sm leading-snug text-white">
      <span className="natal-astro-glyph text-base text-[#F6E7A1]" aria-hidden>
        {signGlyph(placement.sign)}
      </span>
      <span className="min-w-0">{signLabel(placement.sign)}</span>
      {arrow ? (
        <span className="ml-auto pl-2 text-white/45" aria-hidden>
          →
        </span>
      ) : null}
    </span>
  );
}
