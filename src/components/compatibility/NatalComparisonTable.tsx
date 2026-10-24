import { planetGlyph } from "@/lib/astro-glyphs";
import { placementText } from "@/components/compatibility/astro-label";
import type { NatalRow, PersonId } from "@/lib/compatibility/types";

const POINT_LABEL: Record<NatalRow["point"], string> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  ascendant: "Асцендент",
};

export function NatalComparisonTable({
  rows,
  names,
}: {
  rows: NatalRow[];
  names: Record<PersonId, string>;
}) {
  return (
    <div>
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">Сравнение положений двух карт</caption>
        <thead>
          <tr className="border-b border-white/15 text-white/55">
            <th scope="col" className="w-[38%] py-3 pr-3 font-normal">
              <span className="sr-only">Точка</span>
            </th>
            <th scope="col" className="w-[31%] py-3 pr-3 font-normal">
              {names.A}
            </th>
            <th scope="col" className="w-[31%] py-3 font-normal">
              {names.B}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.point} className="border-b border-white/10">
              <th scope="row" className="py-4 pr-3 align-top font-normal text-white">
                <span className="inline-flex items-start gap-2">
                  <span className="natal-astro-glyph text-[#F6E7A1]" aria-hidden>
                    {planetGlyph(row.point)}
                  </span>
                  {POINT_LABEL[row.point]}
                </span>
              </th>
              <td className="py-4 pr-3 align-top text-white/80">{placementText(row.a)}</td>
              <td className="py-4 align-top text-white/80">{placementText(row.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
