import type { PersonCycle } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

export function IndividualCycleCard({
  cycle,
  personName,
}: {
  cycle: PersonCycle;
  personName: string;
}) {
  return (
    <article className={insightCardClass}>
      <h3 className="font-grotesk text-xl font-normal leading-tight text-white sm:text-2xl">{personName}</h3>
      <h4 className="mt-3 font-display text-2xl italic leading-[1.15] text-[#F6E7A1]">{cycle.title}</h4>
      <p className="mt-3 text-sm text-white/70">{cycle.period}</p>
      <p className="mt-4 text-base leading-relaxed text-white/80">{cycle.personalInsight}</p>
      <p className="mt-3 text-base leading-relaxed text-white/80">{cycle.relationshipNote}</p>
    </article>
  );
}
