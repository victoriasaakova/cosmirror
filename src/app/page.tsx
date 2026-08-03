import Image from "next/image";
import { Header } from "@/components/Header";
import { FallingPills } from "@/components/FallingPills";
import { WhatYouGet } from "@/components/WhatYouGet";

const FAMILIAR_CARDS = [
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-[#ff7b36]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path
          d="M24 14 C21 8 13 8 9 14 C5 20 9 28 24 38 C39 28 43 20 39 14 C35 8 27 8 24 14 Z"
          strokeOpacity="0.9"
        />
        <path d="M24 14 L22 21 L26 26 L23 32 L24 38" strokeOpacity="0.9" />
      </svg>
    ),
    title: "Все повторяется",
    text: "Кажется, что одни и те же ситуации происходят снова и снова, даже когда кажется, что ты уже изменилась.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-[#ff7b36]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path
          d="M 24 24 A 3 3 0 0 1 24 18 A 6 6 0 0 1 24 30 A 9 9 0 0 1 24 12 A 12 12 0 0 1 24 36 A 15 15 0 0 1 24 9 A 17 17 0 0 1 24 41"
          strokeOpacity="0.9"
        />
      </svg>
    ),
    title: "Не понимаю, что со мной происходит",
    text: "Иногда много сил и вдохновения. Иногда всё словно останавливается. И непонятно почему.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-[#ff7b36]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M27 8 L14 26 H25 L21 40 L34 22 H23 Z" strokeOpacity="0.9" />
      </svg>
    ),
    title: "Не знаю, куда уходит энергия",
    text: "День заканчивается, а ощущение такое, будто силы ушли не туда, куда действительно хотелось.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-[#ff7b36]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <ellipse cx="24" cy="36" rx="14" ry="5" strokeOpacity="0.9" />
        <ellipse cx="24" cy="25" rx="10" ry="4" strokeOpacity="0.9" />
        <ellipse cx="24" cy="15" rx="6" ry="3" strokeOpacity="0.9" />
      </svg>
    ),
    title: "Не чувствую внутренней опоры",
    text: "Хочется понимать себя лучше и принимать решения не только под влиянием эмоций момента.",
  },
];

const HOW_CARDS = [
  {
    title: "Понять свои циклы",
    image: "/images/report-card-plot-1.png",
    alt: "Астрологические циклы",
    text: "Узнай, какие астрологические циклы ты проживаешь сейчас, и получи понятное объяснение того, как они могут проявляться именно в твоей жизни.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#ff7b36]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    title: "Увидеть свою силу",
    image: "/images/report-card-plot-2.png",
    alt: "Сильные стороны и паттерны",
    text: "Исследуй свои сильные стороны, внутренние потребности, мотивацию и повторяющиеся паттерны через натальную карту — без сложных астрологических терминов.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#ff7b36]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" strokeOpacity="0.6" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Заметить свои паттерны",
    image: "/images/report-card-plot-3.png",
    alt: "Закономерности и энергия",
    text: "Отмечай свои состояния, события и уровень энергии. Cosmirror помогает увидеть, что действительно наполняет тебя, что истощает и какие сценарии повторяются снова и снова.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#ff7b36]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M17 7h4v4" />
      </svg>
    ),
  },
  {
    title: "Переписать свою историю",
    image: "/images/report-card-plot-4.png",
    alt: "Инсайты от AI",
    text: "AI знает твою карту, текущие циклы и историю наблюдений. Он помогает увидеть связи, которые легко упустить, когда находишься внутри ситуации.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#ff7b36]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeOpacity="0.4" />
        <path d="M12 5l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" />
      </svg>
    ),
  },
];

const CONNECTS = [
  "свои состояния",
  "жизненные события",
  "повторяющиеся сценарии",
  "текущие астрологические циклы",
];

const NOT_PROMISES = [
  "Мы не предсказываем будущее.",
  "Мы не говорим, какие решения тебе принимать.",
  "Мы не утверждаем, что звезды определяют твою жизнь.",
  "Мы не заменяем психолога или терапию.",
];

function ConnectIcon({ index }: { index: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.35,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons = [
    <g key="state" {...common}>
      <circle cx="24" cy="24" r="17" opacity="0.35" />
      <path d="M24 24c0-4 6-4 6 1 0 7-12 8-14 0-3-11 12-17 20-8 9 11-1 26-15 23" />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
    </g>,
    <g key="events" {...common}>
      <circle cx="24" cy="24" r="5" />
      <circle cx="24" cy="8" r="2.5" />
      <circle cx="40" cy="24" r="2.5" />
      <circle cx="24" cy="40" r="2.5" />
      <circle cx="8" cy="24" r="2.5" />
      <path d="M24 10.5V19M37.5 24H29M24 29v8.5M10.5 24H19" opacity="0.75" />
    </g>,
    <g key="patterns" {...common}>
      <circle cx="18" cy="24" r="11" />
      <circle cx="30" cy="24" r="11" />
      <path d="M18 13c7 5 7 17 0 22M30 13c-7 5-7 17 0 22" opacity="0.55" />
    </g>,
    <g key="cycles" {...common}>
      <circle cx="24" cy="24" r="5" />
      <ellipse cx="24" cy="24" rx="18" ry="8" />
      <ellipse cx="24" cy="24" rx="18" ry="8" transform="rotate(60 24 24)" opacity="0.65" />
      <circle cx="38" cy="19" r="2" fill="currentColor" stroke="none" />
    </g>,
  ];

  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8 shrink-0 text-[#ff7b36]"
      aria-hidden
    >
      {icons[index]}
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* ── Header Component with Mobile Burger ── */}
      <Header />

      {/* ── Hero Section ── */}
      <section id="top" className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Futuristic 3D Biomorphic Night World Background */}
        <Image
          src="/images/hero-cosmirror-surreal-lake-v2.png"
          alt="Cosmirror Futuristic Biomorphic Night World"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Seamless Bottom Gradient Fade into next section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#07070c]/50 to-[#07070c]"
        />

        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center md:px-8">
          {/* Centered Headline */}
          <h1 className="reveal font-display text-4xl leading-[1.06] tracking-tight text-white min-[420px]:text-5xl sm:text-6xl md:text-7xl lg:text-[4.8rem] max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            Начни замечать{" "}
            <span className="font-display italic text-[#ff7b36]">закономерности</span>{" "}
            своей жизни
          </h1>

          {/* Centered Subtitle */}
          <p className="reveal reveal-delay-1 mt-6 max-w-xl text-base font-light leading-relaxed text-white/90 sm:text-lg md:text-xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Cosmirror помогает лучше понимать себя через астрологию
            <br className="hidden sm:inline" /> и увидеть историю, которая развивается вместе с тобой.
          </p>

          {/* Single White CTA Button with Black Text and Headline Font */}
          <div className="reveal reveal-delay-2 mt-9 flex justify-center">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-white hover:bg-zinc-100 text-black font-display font-semibold text-lg md:text-xl px-10 py-3.5 shadow-[0_12px_36px_rgba(255,255,255,0.25)] transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Начать путешествие
            </a>
          </div>
        </div>
      </section>

      {/* ── If this is familiar ── */}
      <section
        id="for"
        className="relative -mt-24 scroll-mt-20 overflow-hidden bg-[linear-gradient(to_bottom,transparent_0,#07070c_10rem,#07070c_100%)] pt-36 pb-24 md:-mt-32 md:pt-48 md:pb-32"
      >
        {/* Section embedded background panorama */}
        <div className="road-panorama pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 sm:h-72 md:h-80">
          <Image
            src="/images/natal-road-panorama-magenta.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_78%]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07070c] via-[#07070c]/70 to-transparent sm:h-32 md:h-36"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Если тебе <span className="font-display italic text-white">знакомо</span> это…
            </h2>
          </div>

          {/* 4 Vertical Cards Grid */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FAMILIAR_CARDS.map((card) => (
              <div
                key={card.title}
                className="group relative flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 p-6 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(255,123,54,0.45)]">
                  {card.icon}
                </div>
                <h3 className="mb-3 font-display text-xl font-normal leading-snug text-white">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70 font-light">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          {/* Natal chart and changing life */}
          <div className="mt-16">
            <h3 className="font-display mx-auto max-w-[34rem] text-center text-2xl leading-snug text-white sm:text-3xl md:text-4xl lg:text-[2.35rem]">
              <span className="block">Твоя натальная карта не меняется,</span>
              <span className="font-display italic text-[#ff7b36]">меняешься ты:</span>
            </h3>

            {/* Changing life, framed by the surreal night garden */}
            <FallingPills />
          </div>
        </div>
      </section>

      {/* ── How it works / Report Cards ── */}
      <section id="how" className="relative overflow-hidden bg-[#07070c] py-24 md:py-32">
        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          {/* Как это работает */}
          <div id="how-it-works" className="mx-auto max-w-3xl scroll-mt-28 text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              С чем <span className="font-display italic text-[#ff7b36]">помогает</span> Cosmirror
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_CARDS.map((card) => (
              <div
                key={card.title}
                className="group relative flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5"
              >
                <div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 group-hover:border-[#ff7b36]/40 transition-all">
                    {card.icon}
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-normal leading-snug text-white mt-3 mb-4">
                    {card.title}
                  </h3>
                </div>

                <div className="relative my-2 aspect-[16/9] w-full overflow-hidden rounded-2xl">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/65 font-light">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          <WhatYouGet />

          <div className="mt-14 flex justify-center">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.98] md:text-xl"
            >
              Построить карту
            </a>
          </div>
        </div>
      </section>

      {/* ── What we don't promise ── */}
      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl">
              Мы используем астрологию как{" "}
              <span className="font-display italic text-[#ff7b36]">инструмент</span> для глубокого
              понимания себя.
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-2xl space-y-2 text-center text-sm leading-relaxed text-white/60 md:text-[15px]">
            {NOT_PROMISES.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connecting the story / CTA ── */}
      <section
        id="access"
        className="relative min-h-[42rem] scroll-mt-24 overflow-hidden pb-32 pt-20 md:min-h-[48rem] md:pb-40 md:pt-28"
      >
        <Image
          src="/images/cosmirror-bottom-landscape.png"
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#07070c] via-[#07070c]/25 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/90"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl">
              Cosmirror помогает <span className="font-display italic text-[#ff7b36]">увидеть</span>{" "}
              закономерности,
              <br className="hidden sm:inline" /> и постепенно ты начинаешь связывать:
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="glass overflow-hidden rounded-[1.75rem] px-6 md:px-9">
              <ul>
                {CONNECTS.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-center gap-4 border-b border-white/10 py-4 text-left last:border-b-0 md:gap-5"
                  >
                    <ConnectIcon index={index} />
                    <span className="flex-1 text-base font-normal text-white/90 md:text-lg">
                      {item}
                    </span>
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffb099] shadow-[0_0_14px_rgba(255,123,54,0.6)]"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl text-center">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.98] md:text-xl"
            >
              Попробовать бесплатно
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/8 bg-[#050508] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
          <p className="font-display text-xl text-white">Cosmirror</p>
          <div className="flex items-center gap-5 text-sm text-white/50">
            <a href="mailto:hello@cosmirror.app" className="transition hover:text-white">
              Contact
            </a>
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
