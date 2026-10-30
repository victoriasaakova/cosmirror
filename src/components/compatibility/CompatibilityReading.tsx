import { glassFrameClass } from "@/components/compatibility/styles";

const READING_CARDS = [
  {
    title: "В чём вы совпадаете",
    text: "Что у вас общего, какие особенности сближают вас и в чём вам легко понимать друг друга.",
  },
  {
    title: "Где возникает напряжение",
    text: "В каких ситуациях ваши реакции, ожидания и способы общения могут расходиться.",
  },
  {
    title: "В чём сила вашей связи",
    text: "Какие особенности каждого из вас могут дополнять друг друга и становиться опорой в отношениях.",
  },
  {
    title: "Как лучше понимать друг друга",
    text: "На какие различия стоит обратить внимание и что может быть важным для каждого из вас.",
  },
];

export function CompatibilityReading() {
  return (
    <section className="mt-16 sm:mt-20" aria-label="Что в разборе">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {READING_CARDS.map((card, index) => (
          <article key={card.title} className={`${glassFrameClass} px-5 py-6 sm:px-7 sm:py-7`}>
            <span className="font-display text-xl italic leading-none text-[#F6E7A1]/80">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-lg font-normal leading-snug text-[#F6E7A1] sm:text-xl">{card.title}</h3>
            <p className="mt-2 text-sm font-normal leading-relaxed text-white/80 sm:text-[0.95rem]">{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
