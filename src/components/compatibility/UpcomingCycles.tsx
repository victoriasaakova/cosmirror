import type { PersonId, UpcomingCycle } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

export function UpcomingCycles({
  cycles,
  names,
}: {
  cycles: UpcomingCycle[];
  names: Record<PersonId, string>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cycles.map((cycle) => (
        <article key={`${cycle.personId}-${cycle.title}`} className={insightCardClass}>
          <h3 className="font-display text-2xl italic leading-[1.15] text-[#F6E7A1]">{cycle.title}</h3>
          <p className="mt-3 text-sm text-white/70">
            {names[cycle.personId]}, {cycle.period}
          </p>
          <p className="mt-3 text-base leading-relaxed text-white/80">{cycle.note}</p>
        </article>
      ))}
    </div>
  );
}
