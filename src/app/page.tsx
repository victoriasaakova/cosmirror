import Image from "next/image";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { Header } from "@/components/Header";
import { FallingPills } from "@/components/FallingPills";
import { PrefetchOnboarding } from "@/components/PrefetchOnboarding";
import { WhatYouGet } from "@/components/WhatYouGet";
import { freshOnboardingHref } from "@/lib/onboarding/paths";

const FAMILIAR_CARDS = [
  {
    icon: "/images/spiral.webp",
    title: "Замкнутый круг",
    text: "Попадаешь в похожие сюжеты в разных сферах жизни и не видишь закономерность, которая за ними стоит.",
  },
  {
    icon: "/images/battery.webp",
    title: "Ощущение тупика",
    text: "Продуктивность есть, но в важных делах появляется сопротивление и чувство, что силы уходят не туда, куда хотелось.",
  },
  {
    icon: "/images/puzzles.webp",
    title: "Фоновый шум",
    text: "Постоянный поиск ответов снаружи вместо того, чтобы научиться слышать собственные сигналы и доверять себе.",
  },
];

const HOW_CARDS = [
  {
    title: "Поймёшь свои циклы",
    text: "Узнаешь, какие циклы ты проживаешь сейчас, поймёшь, как они могут проявляться именно в твоей жизни, и сможешь ими управлять.",
    image: "/images/planet.webp",
  },
  {
    title: "Раскроешь свою силу",
    text: "Узнаешь, какие у тебя сильные стороны, и научишься опираться на них в жизни, чтобы раскрыть свой потенциал.",
    image: "/images/flower.webp",
  },
  {
    title: "Заметишь свои паттерны",
    text: "Сможешь отслеживать свои состояния, повторяющиеся сценарии и уровень энергии, чтобы легче ими управлять.",
    image: "/images/pattern.webp",
  },
  {
    title: "Соберёшь живую карту себя",
    text: "Увидишь взаимосвязи между своей историей и влиянием планет, сможешь делать более осознанные выборы с помощью AI-компаньона.",
    image: "/images/moon.webp",
  },
];

/** Desktop constellation — original sketch proportions */
const CONNECTS_DESKTOP = [
  { label: "свою карту", x: 22, y: 80, labelAt: "right" as const },
  { label: "свои состояния", x: 28, y: 50, labelAt: "right" as const },
  { label: "астрологические циклы", x: 48, y: 14, labelAt: "right" as const },
  { label: "жизненные события", x: 60, y: 46, labelAt: "right" as const },
  { label: null, x: 86, y: 72, labelAt: "right" as const },
];

const CONNECT_LINES_DESKTOP = [
  { x1: 22, y1: 80, x2: 28, y2: 50 },
  { x1: 28, y1: 50, x2: 48, y2: 14 },
  { x1: 48, y1: 14, x2: 60, y2: 46 },
  { x1: 60, y1: 46, x2: 60, y2: 72 },
  { x1: 60, y1: 72, x2: 86, y2: 72 },
];

/** Mobile — zigzag from the sketch, compact & centered */
const CONNECTS_MOBILE = [
  { label: "свои состояния", x: 10, y: 8, labelAt: "right" as const },
  { label: "жизненные события", x: 34, y: 30, labelAt: "right" as const },
  { label: "свою карту", x: 14, y: 52, labelAt: "right" as const },
  { label: "астрологические циклы", x: 8, y: 74, labelAt: "right" as const },
];

const CONNECT_LINES_MOBILE = [
  { x1: 10, y1: 8, x2: 34, y2: 30 },
  { x1: 34, y1: 30, x2: 14, y2: 52 },
  { x1: 14, y1: 52, x2: 8, y2: 74 },
];

type ConnectNode = {
  label: string | null;
  x: number;
  y: number;
  labelAt: "right" | "below";
};
type ConnectLine = (typeof CONNECT_LINES_DESKTOP)[number];

const FAQ_ITEMS = [
  {
    q: "Что делает Cosmirror?",
    a: "Мы используем астрологию как инструмент для глубокого понимания себя. Связываем карту, циклы и твои реакции — и показываем повторяющиеся сценарии раньше, через паттерны поведения, энергии и выбора.",
  },
  {
    q: "Что входит в персональный отчёт?",
    a: "Персонализированный разбор твоей натальной карты: планеты и их положения, твои паттерны поведения, энергии и выбора, текущие астрологические циклы и то, что может отзываться именно тебе. Плюс мягкие рекомендации по циклам и событиям и вопросы.",
  },
  {
    q: "Вы предсказываете будущее?",
    a: "Нет. Мы не даём прогнозов и не обещаем, что произойдёт дальше. Это способ заметить, какие внутренние темы могут быть громче на фоне текущих циклов.",
  },
  {
    q: "Вы говорите, какие решения принимать?",
    a: "Нет. Мы подсвечиваем закономерности и опоры — выбор всегда остаётся за тобой. Без гарантий и готовых «правильных» ответов.",
  },
  {
    q: "Значит ли это, что звёзды определяют мою жизнь?",
    a: "Нет. Мы не утверждаем, что звёзды определяют твою жизнь. Натальная карта — внутренний контекст для наблюдения за собой, а не судьба и не приговор.",
  },
  {
    q: "Это замена психологу или терапии?",
    a: "Нет. Cosmirror не заменяет психолога или терапию и не ставит медицинских диагнозов. Это спокойный инструмент самонаблюдения рядом с твоим реальным опытом.",
  },
];

function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-3 w-3 items-center justify-center sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${className}`}>
      <span
        aria-hidden
        className="absolute inset-0 animate-pulse-dot rounded-full bg-[#F6E7A1]/45"
      />
      <span className="relative h-2 w-2 rounded-full bg-[#F6E7A1] shadow-[0_0_12px_rgba(246,231,161,0.9)] sm:h-2.5 sm:w-2.5 md:h-3 md:w-3" />
    </span>
  );
}

function ConnectLabel({ text }: { text: string }) {
  const [first, ...rest] = text.split(" ");
  const second = rest.join(" ");
  return (
    <span className="inline-flex items-baseline gap-x-1.5 whitespace-nowrap text-base leading-none sm:text-lg md:text-xl lg:text-2xl">
      <span className="font-display italic text-[#F6E7A1]">{first}</span>
      {second ? <span className="not-italic text-white">{second}</span> : null}
    </span>
  );
}

function ConstellationPlot({
  nodes,
  lines,
  className,
}: {
  nodes: readonly ConnectNode[];
  lines: readonly ConnectLine[];
  className?: string;
}) {
  return (
    <div className={className}>
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {lines.map((line) => (
          <line
            key={`${line.x1},${line.y1}-${line.x2},${line.y2}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(246,231,161,0.6)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {nodes.map((node, index) => (
        <div
          key={`${node.label ?? "tail"}-${index}`}
          className="absolute z-10 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {node.labelAt === "below" ? (
            <>
              <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                <PulseDot />
              </div>
              {node.label ? (
                <div className="absolute left-0 top-0 -translate-x-1/2 translate-y-7 sm:translate-y-8 md:translate-y-9">
                  <ConnectLabel text={node.label} />
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-center">
              <div className="relative w-0 shrink-0">
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <PulseDot />
                </div>
              </div>
              {node.label ? (
                <div className="pl-5 sm:pl-6 md:pl-7">
                  <ConnectLabel text={node.label} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      <PrefetchOnboarding />
      {/* ── Header Component with Mobile Burger ── */}
      <Header />

      {/* ── Hero Section ── */}
      {/*
        Image is a true background. Section height follows text + a width-scaled
        bottom pad (so the scene area shrinks/grows with viewport), not 100dvh + a separate square block.
      */}
      <section
        id="top"
        className="relative overflow-hidden bg-[#050d4a] pt-[7.5rem] pb-[min(58vw,22rem)] sm:pt-36 sm:pb-[min(52vw,24rem)] md:pt-40 md:pb-[min(42vw,26rem)] lg:pt-44"
      >
        <Image
          src="/images/hero-coastal-moon-trail_4.webp"
          alt=""
          fill
          priority
          quality={95}
          className="z-0 object-cover object-[center_78%] sm:object-[center_72%] md:object-[center_68%] lg:object-[center_65%]"
          sizes="100vw"
          aria-hidden
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[40%] bg-gradient-to-b from-[#050d4a]/70 via-[#050d4a]/25 to-transparent"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-b from-transparent to-[#050d4a] md:h-20"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center md:px-8">
          <h1 className="reveal font-grotesk text-4xl font-normal leading-[1.08] tracking-[-0.03em] text-white min-[420px]:text-5xl sm:text-6xl md:text-7xl lg:text-[4.8rem] max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            Начни замечать{" "}
            <span className="font-display inline-block pb-1 font-normal italic leading-[1.12] tracking-normal text-[#F6E7A1]">
              закономерности
            </span>
            <br className="hidden sm:block lg:hidden" />
            {" "}
            своей&nbsp;жизни
          </h1>

          <p className="reveal reveal-delay-1 mt-5 w-[min(100%,26rem)] font-grotesk text-base font-normal leading-relaxed text-white/80 sm:mt-6 sm:w-[34rem] sm:text-lg md:w-[38rem] md:text-xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Соединяем точность астрологии с&nbsp;твоим реальным опытом
            в&nbsp;историю, которая меняется вместе с&nbsp;тобой.
          </p>

          <div className="reveal reveal-delay-2 mt-8 flex justify-center sm:mt-9">
            <a
              href={freshOnboardingHref()}
              className="inline-flex items-center justify-center rounded-full bg-[#F6E7A1] hover:bg-[#f0dc82] text-[#0a1a3a] font-grotesk font-medium text-lg md:text-xl px-10 py-2.5 shadow-[0_10px_28px_rgba(246,231,161,0.28)] transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Начать путешествие
            </a>
          </div>
        </div>
      </section>

      {/* ── Eye bridge — tight under hero ── */}
      <div className="relative z-10 -mt-2 flex justify-center bg-[#050d4a] px-5 pb-3 pt-2 sm:-mt-3 sm:pb-4 sm:pt-3 md:pb-5">
        <Image
          src="/images/eye-silver.webp"
          alt=""
          width={512}
          height={512}
          className="animate-eye-spin h-auto w-[min(42vw,11rem)] sm:w-[min(36vw,13rem)] md:w-[14rem]"
          sizes="(max-width: 768px) 42vw, 14rem"
          // Don't compete with CSS/hero on slow LTE — load after first paint
          loading="lazy"
        />
      </div>

      {/* ── If this is familiar ── */}
      <section
        id="for"
        className="relative scroll-mt-20 overflow-hidden bg-[#050d4a] pt-3 pb-0 md:pt-5"
      >
        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Если тебе{" "}
              <span className="font-display italic text-[#F6E7A1]">знакомо</span> это…
            </h2>
          </div>

          {/* Familiar moments as accent-bordered cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:mt-12 lg:gap-7">
            {FAMILIAR_CARDS.map((card) => (
              <article
                key={card.title}
                className="flex flex-col items-center rounded-2xl border border-[#F6E7A1]/55 bg-white/[0.03] px-5 py-7 text-center sm:px-6 sm:py-8"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center sm:mb-5 sm:h-14 sm:w-14">
                  <Image
                    src={card.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    sizes="56px"
                  />
                </div>
                <h3 className="mb-2 text-lg font-normal leading-snug text-[#F6E7A1] sm:mb-3 sm:text-xl">
                  {card.title}
                </h3>
                <p className="mx-auto w-full max-w-[28rem] text-sm font-normal leading-relaxed text-white/80 sm:text-[0.95rem]">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Constellation — full-bleed stars background */}
        <div
          id="access"
          className="relative mt-8 min-h-[36rem] scroll-mt-24 overflow-hidden pb-8 pt-10 sm:mt-10 sm:min-h-[42rem] sm:pb-10 sm:pt-12 md:min-h-[52rem] md:pb-44 md:pt-14"
        >
          <Image
            src="/images/landscape_stars.webp"
            alt=""
            fill
            className="object-cover object-[center_58%]"
            sizes="100vw"
          />
          {/* Top seam + mountains soft darken; button zone clearer; bottom seam */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_bottom,#050d4a_0%,rgba(5,13,74,0.75)_8%,transparent_24%,transparent_48%,rgba(5,13,74,0.35)_60%,rgba(5,13,74,0.2)_72%,transparent_80%,rgba(5,13,74,0.5)_92%,#050d4a_100%)]"
          />

          <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                Cosmirror <span className="font-display italic text-[#F6E7A1]">помогает</span>{" "}
                связывать
              </h2>
            </div>

            <ConstellationPlot
              nodes={CONNECTS_MOBILE}
              lines={CONNECT_LINES_MOBILE}
              className="relative mx-auto mt-8 h-[16rem] w-full max-w-[22rem] md:hidden"
            />
            <ConstellationPlot
              nodes={CONNECTS_DESKTOP}
              lines={CONNECT_LINES_DESKTOP}
              className="relative mx-auto mt-12 hidden h-[30rem] w-full max-w-3xl md:block"
            />

            {/* Desktop spacer — former button height so landscape doesn’t collide */}
            <div className="hidden h-28 md:block lg:h-32" aria-hidden />
          </div>
        </div>
      </section>

      {/* ── How it works / Report Cards ── */}
      <section id="how" className="relative overflow-hidden bg-[#050d4a] pb-24 pt-10 md:pb-32 md:pt-12">
        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          {/* Как это работает */}
          <div id="how-it-works" className="mx-auto max-w-3xl scroll-mt-28 text-center">
            <h2 className="text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Как это <span className="font-display italic text-[#F6E7A1]">работает</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {HOW_CARDS.map((card, index) => (
              <div
                key={card.title}
                className="group relative flex flex-col rounded-2xl border border-[#F6E7A1]/55 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F6E7A1]/80 hover:bg-white/[0.06] sm:p-7"
              >
                <span className="mb-3 self-end font-display text-xl italic leading-none text-[#F6E7A1]/80 sm:text-2xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="mb-4 flex h-28 w-full items-start justify-start sm:h-32 md:h-36">
                  <Image
                    src={card.image}
                    alt=""
                    width={196}
                    height={196}
                    className="h-full w-auto max-w-full object-contain object-left"
                    sizes="(max-width: 768px) 80vw, 40vw"
                  />
                </div>
                <h3 className="mb-3 text-lg font-normal leading-snug text-[#F6E7A1] sm:text-xl">
                  {card.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-white/80 sm:text-[0.95rem]">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          <WhatYouGet />

          <div className="mt-12 flex justify-center sm:mt-14">
            <a
              href={freshOnboardingHref()}
              className="inline-flex items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] shadow-[0_10px_28px_rgba(246,231,161,0.28)] transition-all hover:scale-[1.03] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
            >
              Попробовать
            </a>
          </div>
        </div>
      </section>

      {/* ── Natal chart and changing life ── */}
      <section className="relative overflow-hidden bg-[#050d4a] pb-24 pt-16 md:pb-32 md:pt-20">
        <div className="road-panorama pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 sm:h-72 md:h-80">
          <Image
            src="/images/landscape_natal_map_2.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_78%]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050d4a] via-[#050d4a]/70 to-transparent sm:h-32 md:h-36"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <h3 className="mx-auto max-w-[34rem] text-center text-2xl font-normal leading-snug text-white sm:text-3xl md:text-4xl lg:text-[2.35rem]">
            <span className="block">Твоя натальная карта не меняется,</span>
            <span className="font-display italic text-[#F6E7A1]">меняешься ты:</span>
          </h3>
          <FallingPills />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative scroll-mt-20 bg-[#050d4a] py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Частые{" "}
              <span className="font-display italic text-[#F6E7A1]">вопросы</span>
            </h2>
          </div>

          <div className="mx-auto mt-10 max-w-2xl divide-y divide-white/10 border-y border-white/10 md:mt-12">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group open:pb-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left md:min-h-16 md:py-4">
                  <span className="text-lg font-normal leading-snug text-white md:text-xl">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[#F6E7A1] transition-transform duration-200 group-open:rotate-45 md:h-12 md:w-12"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 md:h-8 md:w-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-2 max-w-xl text-sm font-normal leading-relaxed text-white/80 md:text-[15px]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/10 bg-[#050d4a] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-5 md:px-8">
          <p className="text-xl font-medium">
            <CosmirrorMark />
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            <a href="/blog/" className="transition hover:text-white">
              Блог
            </a>
            <a href="/privacy/" className="transition hover:text-white">
              Политика конфиденциальности
            </a>
            <a href="/cookies/" className="transition hover:text-white">
              Политика cookie
            </a>
            <a href="/terms/" className="transition hover:text-white">
              Пользовательское соглашение
            </a>
            <a href="/offer/" className="transition hover:text-white">
              Публичная оферта
            </a>
            <a href="/source/" className="transition hover:text-white">
              Исходный код
            </a>
            <a href="mailto:hello@cosmirror.ru" className="transition hover:text-white">
              hello@cosmirror.ru
            </a>
          </nav>
          <p className="text-xs leading-relaxed text-white/40">
            Саакова Виктория · ИНН 773180561611
          </p>
        </div>
      </footer>
    </main>
  );
}
