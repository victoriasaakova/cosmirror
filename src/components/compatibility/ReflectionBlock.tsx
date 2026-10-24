import type { CompatibilityResult } from "@/lib/compatibility/types";

export function ReflectionBlock({ reflection }: { reflection: CompatibilityResult["reflection"] }) {
  return (
    <section className="mx-auto mt-20 w-full max-w-3xl pb-4" aria-labelledby="reflection-title">
      <h2
        id="reflection-title"
        className="font-display text-3xl italic leading-[1.2] text-[#F6E7A1] md:text-4xl"
      >
        {reflection.question}
      </h2>
      {reflection.conclusion ? (
        <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-white/80">{reflection.conclusion}</p>
      ) : null}
    </section>
  );
}
