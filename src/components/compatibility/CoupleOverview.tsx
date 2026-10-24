import type { CompatibilityResult } from "@/lib/compatibility/types";

export function CoupleOverview({ result }: { result: CompatibilityResult }) {
  if (!result.overview.summary && result.warnings.length === 0) return null;

  return (
    <section className="mx-auto mt-10 w-full max-w-3xl text-center" aria-label="Коротко о связи">
      {result.overview.summary ? (
        <p className="text-base leading-relaxed text-white/80 md:text-lg">{result.overview.summary}</p>
      ) : null}
      {result.warnings.map((warning) => (
        <p key={warning} className="mt-4 text-sm leading-relaxed text-[#F6E7A1]">
          {warning}
        </p>
      ))}
    </section>
  );
}
