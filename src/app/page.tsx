import Image from "next/image";
import { WaitlistForm } from "@/components/WaitlistForm";

const NAV = [
  { href: "#how", label: "Как это работает" },
  { href: "#get", label: "Что получишь" },
  { href: "#for", label: "Если знакомо" },
];

const FAMILIAR = [
  "Ты снова оказываешься в похожих отношениях.",
  "Или снова сомневаешься перед важным решением.",
  "Иногда много энергии и вдохновения — а иногда силы исчезают без понятной причины.",
  "Читаешь психологию. Смотришь натальную карту. Ищешь ответы.",
  "Но всё остаётся отдельными кусочками.",
];

const CONNECTS = [
  "свои состояния",
  "жизненные события",
  "повторяющиеся сценарии",
  "текущие астрологические циклы",
];

const BENEFITS = [
  "Быстрее понимать, что с тобой происходит.",
  "Замечать повторяющиеся жизненные сценарии.",
  "Видеть, что действительно даёт тебе энергию, а что постепенно её забирает.",
  "Принимать решения, опираясь не только на эмоции момента, но и на понимание собственных закономерностей.",
];

const GETS = [
  {
    title: "Первый персональный портрет",
    text: "Краткое описание твоих сильных сторон, внутренних противоречий и одного паттерна, который стоит понаблюдать в своей жизни.",
  },
  {
    title: "Новый взгляд на себя",
    text: "Не набор общих характеристик, а персональные гипотезы, которые можно соотнести со своим опытом.",
  },
  {
    title: "Ранний доступ к Cosmirror",
    text: "Ты одна из первых получишь доступ к продукту, который помогает соединять натальную карту с твоими наблюдениями и постепенно открывать новые закономерности о себе.",
  },
];

const NOT_PROMISES = [
  "Мы не предсказываем будущее.",
  "Мы не говорим, какие решения тебе принимать.",
  "Мы не утверждаем, что звёзды определяют твою жизнь.",
  "Мы не заменяем психолога или терапию.",
];

const FOR_WHOM = [
  {
    icon: "↻",
    text: "«Почему я снова оказываюсь в похожих ситуациях?»",
  },
  {
    icon: "✦",
    text: "«Я пытаюсь понять, что со мной происходит — и всё остаётся кусочками.»",
  },
  {
    icon: "◌",
    text: "«Хочу видеть закономерности своей жизни, а не гадать вслепую.»",
  },
];

function IconOrbit() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-[var(--peach)]" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.9" />
      <ellipse cx="24" cy="24" rx="18" ry="8" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.45"
        transform="rotate(60 24 24)"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9 text-[var(--peach)]" fill="currentColor" aria-hidden>
      <path d="M24 6l2.4 14.2L40 24l-13.6 3.8L24 42l-2.4-14.2L8 24l13.6-3.8L24 6z" opacity="0.9" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9 text-[var(--peach)]" fill="none" aria-hidden>
      <path
        d="M12 10l12-4 12 4v28l-12-4-12 4V10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M24 6v28" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* ── Header ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8 md:py-6">
          <a href="#top" className="font-display text-2xl tracking-tight text-white md:text-[1.65rem]">
            Cosmirror
          </a>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <a href="#access" className="btn-ghost px-4 py-2 text-sm md:px-5">
            Получить портрет →
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/images/hero-moon.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-transparent to-black/40"
        />

        <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-28 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pt-24">
          <div className="max-w-xl">
            <h1 className="reveal font-display text-[2.35rem] leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl md:text-[3.4rem] lg:text-[3.75rem]">
              Перестань искать
              <br />
              случайные объяснения.
            </h1>
            <p className="reveal reveal-delay-1 mt-5 max-w-md font-display text-xl leading-snug text-[var(--peach)]/95 md:text-2xl">
              Начни видеть закономерности своей жизни.
            </p>
            <p className="reveal reveal-delay-2 mt-6 max-w-lg text-[15px] leading-relaxed text-white/70 md:text-base">
              Cosmirror превращает натальную карту в{" "}
              <span className="text-white/90">Живую карту</span> — историю, которая развивается вместе
              с тобой. Не чтобы предсказывать будущее. А чтобы лучше понимать себя, свои состояния,
              повторяющиеся сценарии и изменения, через которые ты проходишь.
            </p>
            <div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-4">
              <a href="#access" className="btn-primary px-6 py-3.5 text-sm md:text-[15px]">
                Получить первый персональный портрет →
              </a>
              <a href="#how" className="text-sm text-white/65 transition hover:text-white">
                Как это работает ↓
              </a>
            </div>
          </div>

          <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
            <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(255,220,180,0.18),transparent_65%)] blur-2xl" />
            <div className="glass animate-float relative rounded-3xl p-6 md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                  Живая карта
                </p>
                <span className="dot-glow animate-pulse-glow" />
              </div>
              <ul className="space-y-4">
                {[
                  { label: "Текущий сезон", value: "Переход" },
                  { label: "Состояния", value: "Что чувствуешь сейчас" },
                  { label: "Что завершается", value: "Старые сценарии" },
                  { label: "Что появляется", value: "Новые закономерности" },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-xs text-white/45">{row.label}</p>
                      <p className="mt-0.5 text-sm text-white/90">{row.value}</p>
                    </div>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--copper)] shadow-[0_0_8px_var(--glow)]" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── If this is familiar ── */}
      <section id="for" className="relative overflow-hidden bg-[#07070c] py-24 md:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,160,122,0.08),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl">
              Если тебе знакомо это…
            </h2>
            <p className="mt-5 text-base text-white/60 md:text-lg">
              Почему со мной снова происходит одно и то же?
            </p>
          </div>

          <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            <ul className="space-y-3">
              {FAMILIAR.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-sm leading-relaxed text-white/70"
                >
                  <span className="mt-0.5 text-[var(--rose)]/80" aria-hidden>
                    ×
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="relative mx-auto flex h-56 w-44 items-center justify-center md:h-64 md:w-52">
              <div className="animate-float absolute left-2 top-4 rounded-2xl border border-[var(--glass-border)] bg-black/40 p-4 shadow-[0_0_40px_rgba(232,160,122,0.15)] backdrop-blur-md">
                <IconOrbit />
              </div>
              <div className="animate-float-delayed absolute bottom-6 right-0 rounded-2xl border border-[var(--glass-border)] bg-black/40 p-4 shadow-[0_0_40px_rgba(232,160,122,0.15)] backdrop-blur-md">
                <IconStar />
              </div>
              <div className="animate-float absolute bottom-16 left-8 rounded-2xl border border-[var(--glass-border)] bg-black/40 p-3.5 shadow-[0_0_40px_rgba(232,160,122,0.12)] backdrop-blur-md [animation-delay:0.6s]">
                <IconMap />
              </div>
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(242,196,168,0.12),transparent_60%)]" />
            </div>

            <div className="space-y-5 text-[15px] leading-relaxed text-white/65 md:text-base">
              <p>
                Ты пытаешься понять, что с тобой происходит. Но все ответы остаются отдельными
                кусочками — их сложно связать с собственной жизнью.
              </p>
              <p className="font-display text-2xl leading-snug text-white md:text-[1.7rem]">
                Твоя натальная карта не меняется.
                <br />
                <span className="text-[var(--peach)]">Но меняешься ты.</span>
              </p>
              <p>
                Твоя жизнь не стоит на месте. Ты принимаешь решения. Переживаешь кризисы. Строишь
                отношения. Теряешь и находишь себя.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works / Living map ── */}
      <section id="how" className="relative overflow-hidden py-24 md:py-32">
        <Image
          src="/images/clouds-sunset.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-55"
          sizes="100vw"
        />
        <div aria-hidden className="absolute inset-0 bg-[#07070c]/70" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#07070c] via-transparent to-[#07070c]"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-5xl">
              Cosmirror помогает увидеть картину целиком
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70 md:text-lg">
              Закономерности своей жизни — с помощью натальной карты и собственного опыта. Мы
              используем натальную карту как отправную точку, а не как готовый ответ.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
            <div className="glass rounded-[1.75rem] p-7 md:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                Постепенно ты начинаешь связывать
              </p>
              <ul className="mt-6 space-y-4">
                {CONNECTS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/85">
                    <span className="dot-glow" />
                    <span className="font-display text-xl md:text-2xl">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-[1.75rem] p-7 md:p-8">
              <p className="font-display text-2xl text-white md:text-3xl">
                Cosmirror собирает твою собственную Живую карту, чтобы
              </p>
              <ul className="mt-6 space-y-4">
                {BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-white/70">
                    <span className="mt-0.5 text-[var(--peach)]" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-white/10 pt-6 text-sm leading-relaxed text-white/55">
                Постепенно снижается ощущение, что «со мной что-то не так» — потому что многие вещи
                начинают складываться в понятную историю.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Portrait preview ── */}
      <section className="relative bg-[#07070c] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl leading-tight text-white md:text-5xl">
              Увидь закономерности своей жизни
            </h2>
            <p className="mt-5 text-base text-white/60 md:text-lg">
              С помощью натальной карты и собственного опыта — не чтобы предсказывать будущее, а
              чтобы замечать повторяющиеся сценарии, свои состояния и внутренние закономерности.
            </p>
          </div>

          <div className="glass relative mx-auto mt-14 max-w-3xl overflow-hidden rounded-[1.75rem] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                  Пример портрета
                </p>
                <p className="mt-3 font-display text-2xl text-white md:text-3xl">
                  Сильные стороны. Внутренние противоречия. Один паттерн, который стоит наблюдать.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  Первый персональный портрет — это не общий гороскоп. Это персональные гипотезы,
                  которые можно соотнести со своим опытом и начать собирать Живую карту.
                </p>
                <a
                  href="#access"
                  className="mt-6 inline-flex text-sm text-[var(--peach)] transition hover:text-white"
                >
                  Получить свой первый портрет →
                </a>
              </div>
              <div className="relative mx-auto flex h-44 w-44 shrink-0 items-center justify-center md:mx-0">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(242,196,168,0.25),transparent_70%)]" />
                <svg viewBox="0 0 160 160" className="relative h-full w-full text-[var(--peach)]" aria-hidden>
                  <circle cx="80" cy="80" r="62" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
                  <circle cx="80" cy="80" r="40" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
                  <path
                    d="M80 18 L88 70 L140 80 L88 90 L80 142 L72 90 L20 80 L72 70 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.55"
                    strokeWidth="1.2"
                  />
                  <circle cx="80" cy="80" r="3" fill="currentColor" />
                  <circle cx="88" cy="70" r="2" fill="currentColor" opacity="0.7" />
                  <circle cx="72" cy="90" r="2" fill="currentColor" opacity="0.7" />
                  <circle cx="110" cy="52" r="1.5" fill="currentColor" opacity="0.5" />
                  <circle cx="50" cy="108" r="1.5" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section id="get" className="relative border-t border-white/5 bg-[#090910] py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-display text-3xl tracking-tight text-white md:text-5xl">Что ты получишь</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {GETS.map((item) => (
              <article key={item.title} className="border-t border-[var(--copper)]/35 pt-6">
                <p className="text-[var(--peach)]" aria-hidden>
                  ✦
                </p>
                <h3 className="mt-3 font-display text-2xl text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we don't promise ── */}
      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h2 className="font-display text-3xl tracking-tight text-white md:text-4xl">
                Чего Cosmirror не обещает
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
                Мы помогаем использовать астрологию как инструмент для более глубокого понимания
                себя.
              </p>
            </div>
            <ul className="space-y-3">
              {NOT_PROMISES.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 text-sm text-white/70 md:text-[15px]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Who this is for ── */}
      <section className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-display text-3xl tracking-tight text-white md:text-4xl">
            Если один из этих вопросов — твой
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FOR_WHOM.map((item) => (
              <div key={item.text} className="glass rounded-2xl p-6">
                <p className="text-lg text-[var(--peach)]" aria-hidden>
                  {item.icon}
                </p>
                <p className="mt-4 font-display text-xl leading-snug text-white/90">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="access" className="relative overflow-hidden py-24 md:py-32">
        <Image
          src="/images/clouds-sunset.jpg"
          alt=""
          fill
          className="object-cover object-[center_70%] opacity-50"
          sizes="100vw"
        />
        <div aria-hidden className="absolute inset-0 bg-[#07070c]/75" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#07070c] via-transparent to-[#07070c]"
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="font-display text-3xl leading-tight text-white md:text-5xl">
            Получи свой первый персональный портрет
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65">
            Оставь email и узнай, какие сильные стороны, внутренние противоречия и жизненные
            паттерны показывает твоя натальная карта.
          </p>
          <div className="mt-10 text-left">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/8 bg-[#050508] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
          <p className="font-display text-xl text-white">Cosmirror</p>
          <p className="text-sm text-white/45">Самопонимание — на языке твоей жизни.</p>
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
