import { aspectGlyph, planetGlyph, PLANET_RU, ASPECT_RU } from "@/lib/astro-glyphs";
import type { SynastryAspect } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

export function SynastryAspectCard({
  aspect,
  names,
}: {
  aspect: SynastryAspect;
  names: Record<"A" | "B", string>;
}) {
  const left = PLANET_RU[aspect.pointA] ?? aspect.pointA;
  const right = PLANET_RU[aspect.pointB] ?? aspect.pointB;
  const name = ASPECT_RU[aspect.aspect] ?? aspect.aspect;
  const pairLabel = `${names.A}: ${left} ${name} ${names.B}: ${right}`;

  return (
    <article className={insightCardClass}>
      <h3 className="break-words text-base font-normal leading-snug text-white sm:text-lg">
        <span className="natal-astro-glyph inline-flex items-baseline gap-1 text-[#F6E7A1]">
          <span>{planetGlyph(aspect.pointA)}</span>
          <span>{aspectGlyph(aspect.aspect)}</span>
          <span>{planetGlyph(aspect.pointB)}</span>
        </span>
        <span className="ml-2">{pairLabel}</span>
      </h3>
      {aspect.interpretation ? (
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-white/80">{aspect.interpretation}</p>
      ) : null}
      <p className="mt-3 text-sm text-white/70">Орб {aspect.orbLabel}</p>
    </article>
  );
}
