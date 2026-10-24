import { PLANET_RU, planetGlyph, signGlyph } from "@/lib/astro-glyphs";
import type { PersonId, SignComparison } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

export function SignComparisons({
  rows,
  names,
}: {
  rows: SignComparison[];
  names: Record<PersonId, string>;
}) {
  return (
    <section className="mt-20" aria-labelledby="signs-title">
      <h2
        id="signs-title"
        className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
      >
        В чём вы похожи и различаетесь
      </h2>
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className={insightCardClass}>
            <h3 className="font-grotesk text-xl font-normal leading-snug text-white sm:text-2xl">{row.title}</h3>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#F6E7A1]">
              <span className="natal-astro-glyph text-base leading-none" aria-hidden>
                {planetGlyph(row.point)}
              </span>
              {PLANET_RU[row.point] ?? row.point}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SignSide name={names.A} sign={row.aSign} label={row.a} />
              <SignSide name={names.B} sign={row.bSign} label={row.b} />
            </div>
            <p className="mt-4 text-base leading-relaxed text-white/80">{row.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SignSide({ name, sign, label }: { name: string; sign: string; label: string }) {
  return (
    <p>
      <span className="block text-sm text-white/70">{name}</span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-base text-white">
        <span className="natal-astro-glyph text-[#F6E7A1]" aria-hidden>
          {signGlyph(sign)}
        </span>
        {label}
      </span>
    </p>
  );
}
