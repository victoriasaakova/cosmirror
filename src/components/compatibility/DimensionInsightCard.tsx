import type { DimensionInsight } from "@/lib/compatibility/types";

export function DimensionInsightCard({ dimension }: { dimension: DimensionInsight }) {
  return (
    <article aria-labelledby={`dimension-${dimension.id}`}>
      <h3
        id={`dimension-${dimension.id}`}
        className="font-grotesk text-2xl font-normal leading-tight text-white md:text-4xl"
      >
        {dimension.headline}
      </h3>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-white/80">{dimension.insight}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-12">
        <div>
          <h4 className="font-display text-xl italic leading-[1.15] text-[#F6E7A1]">Что вас объединяет</h4>
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/80">{dimension.commonGround}</p>
        </div>
        <div>
          <h4 className="font-display text-xl italic leading-[1.15] text-[#F6E7A1]">Где может возникать напряжение</h4>
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/80">{dimension.tension}</p>
        </div>
      </div>

      {dimension.astroBasis.length > 0 ? (
        <div className="mt-8 max-w-[65ch] space-y-3">
          {dimension.astroBasis.map((line) => (
            <p key={line} className="text-base leading-relaxed text-white/80">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
