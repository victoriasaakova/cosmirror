import Image from "next/image";
import type { PairArcanaPerson, PairTarotCard, PersonId } from "@/lib/compatibility/types";
import { glassFrameClass } from "@/components/compatibility/styles";

const accentClass = "font-display italic tracking-normal text-[#F6E7A1]";

export function PairCard({ card, names }: { card?: PairTarotCard; names: Record<PersonId, string> }) {
  if (!card) return null;
  const title = card.love?.name || card.card.name;
  const arithmetic = pairArithmetic(card.persons, names, card.card.number);
  return (
    <section className="mt-24 sm:mt-32" aria-labelledby="pair-card-title">
      <article className={`${glassFrameClass} px-5 py-6 sm:px-7 sm:py-8`}>
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-8 lg:gap-10">
          <div className="w-[min(52vw,14rem)] shrink-0 sm:w-[15rem] md:w-[16rem] lg:w-[17rem]">
            <div className={`${glassFrameClass} bg-[#070b2e]/40 p-3 sm:p-4`}>
              <Image
                src={card.card.image}
                alt={title}
                width={780}
                height={1344}
                className="h-auto w-full"
                sizes="(max-width: 768px) 52vw, 272px"
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col text-center md:text-left">
            <h2
              id="pair-card-title"
              className="text-balance font-grotesk text-2xl font-normal leading-[1.15] tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl"
            >
              Карта вашей пары: <span className={accentClass}>{title}</span>
            </h2>
            {card.love ? (
              <div className="mt-6 space-y-5 sm:mt-7">
                <div>
                  <h3 className="font-grotesk text-lg font-normal text-[#F6E7A1] sm:text-xl">Главная тема отношений</h3>
                  <p className="mt-2 text-base leading-relaxed text-white/80">{card.love.upright}</p>
                </div>
                <div>
                  <h3 className="font-grotesk text-lg font-normal text-[#F6E7A1] sm:text-xl">Теневая сторона</h3>
                  <p className="mt-2 text-base leading-relaxed text-white/80">{card.love.reversed}</p>
                </div>
              </div>
            ) : null}
            <p className="mt-8 text-xs leading-relaxed text-white/55 md:mt-auto md:pt-8">
              Личный аркан считают как сумму цифр даты рождения. Если она больше 22, из неё вычитают 22, пока не останется
              число от 1 до 22. Аркан пары считают так же: это сумма двух личных арканов.
              {arithmetic ? ` ${arithmetic}` : ""}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

function pairArithmetic(persons: PairArcanaPerson[], names: Record<PersonId, string>, cardNumber: number) {
  if (persons.length !== 2) return "";
  const [first, second] = persons;
  const total = first.number + second.number;
  let value = total;
  while (value > 22) value -= 22;
  if (value !== cardNumber) return "";
  const named = persons
    .map((person) => {
      const name = names[person.id]?.trim();
      return name ? `${name} - ${person.number}, ${person.name}` : "";
    })
    .filter(Boolean);
  if (named.length !== 2) return "";
  const sum = `${first.number} + ${second.number} = ${total}`;
  const folded = total === value ? sum : `${sum}. ${total} больше 22, поэтому остаётся ${value}`;
  return `${named[0]}. ${named[1]}. ${folded}.`;
}
