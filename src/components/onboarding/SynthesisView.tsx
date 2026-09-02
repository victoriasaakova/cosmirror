import { buildSynthesis } from "@/lib/onboarding/synthesis";

const TITLE_CLASS =
  "text-[1.875rem] font-normal leading-[1.15] tracking-tight text-white lg:text-[2.35rem]";

const BLOCKS: { key: "happening" | "question" | "method"; label: string }[] = [
  { key: "happening", label: "Что происходит" },
  { key: "question", label: "Главный вопрос" },
  { key: "method", label: "Как будем разбирать" },
];

const REVEAL_DELAYS = ["", " reveal-delay-1", " reveal-delay-2", " reveal-delay-3"] as const;

export function SynthesisView({ answers }: { answers: Record<string, unknown> }) {
  const copy = buildSynthesis(answers);
  return (
    <div className="flex flex-col">
      <h1 className={TITLE_CLASS}>
        {copy.name ? `${copy.name}, вот что мы уже ` : "Вот что мы уже "}
        <span className="font-display italic text-[#F6E7A1]">поняли</span>
      </h1>
      <div className="mt-6 flex flex-col gap-3.5 md:mt-8 md:gap-5">
        {BLOCKS.map((block, index) => (
          <article
            key={block.key}
            className={`onboarding-synthesis-block reveal${REVEAL_DELAYS[index + 1] ?? ""}`}
          >
            <h2 className="onboarding-synthesis-block__title">{block.label}</h2>
            <p className="onboarding-synthesis-block__text">{copy[block.key]}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
