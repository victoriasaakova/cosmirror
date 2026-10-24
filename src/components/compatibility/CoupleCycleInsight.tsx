import type { CoupleCycle } from "@/lib/compatibility/types";
import { insightCardClass } from "@/components/compatibility/styles";

export function CoupleCycleInsight({ cycle }: { cycle: CoupleCycle }) {
  return (
    <article className={insightCardClass}>
      <h3 className="font-grotesk text-xl font-normal leading-tight text-white sm:text-2xl">{cycle.title}</h3>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-white/80">{cycle.text}</p>
    </article>
  );
}
