"use client";

import { useState } from "react";

const ITEMS = [
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

const ZODIAC_PATHS = [
  "M4 12C4 6 8 4 12 10C16 4 20 6 20 12M12 10V21",
  "M5 4C6 8 9 9 12 9C15 9 18 8 19 4M12 9A7 7 0 1 1 11.99 9",
  "M7 4C10 5 14 5 17 4M7 20C10 19 14 19 17 20M9 5V19M15 5V19",
  "M5 9C8 5 15 5 18 8C20 10 18 13 15 12C13 11 14 8 17 8M19 15C16 19 9 19 6 16C4 14 6 11 9 12C11 13 10 16 7 16",
  "M6 17C2 12 6 8 10 11C13 14 11 19 8 19C5 19 4 16 6 14M10 11C11 5 18 4 19 9C20 13 16 15 15 20",
  "M4 5V16M4 8C6 4 9 5 9 9V16M9 8C11 4 14 5 14 9V16C14 20 19 20 20 16M14 12C17 12 19 14 19 17",
  "M5 14H19M4 18H20M8 14C8 8 16 8 16 14",
  "M4 5V16M4 8C6 4 9 5 9 9V16M9 8C11 4 14 5 14 9V16H20M17 13L20 16L17 19",
  "M5 19L19 5M12 5H19V12M6 8L16 18",
  "M4 5V16M4 9C7 5 11 6 11 10V17C11 21 17 21 19 17C21 13 16 12 14 15",
  "M3 9C6 6 9 12 12 9C15 6 18 12 21 9M3 15C6 12 9 18 12 15C15 12 18 18 21 15",
  "M7 4C13 8 13 16 7 20M17 4C11 8 11 16 17 20M4 12H20",
];

const PLANETS = [
  { glyph: "☉", x: 100, y: 48 },
  { glyph: "☽", x: 58, y: 76 },
  { glyph: "☿", x: 126, y: 90 },
  { glyph: "♀", x: 72, y: 126 },
  { glyph: "♂", x: 137, y: 126 },
  { glyph: "♃", x: 46, y: 111 },
  { glyph: "♄", x: 109, y: 142 },
];

function roundCoordinate(value: number) {
  return Number(value.toFixed(3));
}

const ZODIAC_SEGMENTS = ZODIAC_PATHS.map((path, index) => {
  const dividerAngle = index * 30 - 90;
  const iconAngle = dividerAngle + 15;
  const dividerRadians = (dividerAngle * Math.PI) / 180;
  const iconRadians = (iconAngle * Math.PI) / 180;
  const x = roundCoordinate(100 + Math.cos(iconRadians) * 81);
  const y = roundCoordinate(100 + Math.sin(iconRadians) * 81);

  return {
    path,
    x,
    y,
    innerX: roundCoordinate(100 + Math.cos(dividerRadians) * 72),
    innerY: roundCoordinate(100 + Math.sin(dividerRadians) * 72),
    outerX: roundCoordinate(100 + Math.cos(dividerRadians) * 91),
    outerY: roundCoordinate(100 + Math.sin(dividerRadians) * 91),
    transform: `translate(${roundCoordinate(x - 6)} ${roundCoordinate(y - 6)}) scale(0.5)`,
  };
});

function BirthChart() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-[92%] w-[92%] text-[#F6E7A1]"
      role="img"
      aria-label="Пример натальной карты"
    >
      <circle cx="100" cy="100" r="91" fill="#071240" stroke="currentColor" strokeOpacity="0.55" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" strokeOpacity="0.16" />

      {ZODIAC_SEGMENTS.map((segment) => (
        <g key={segment.path}>
          <line
            x1={segment.innerX}
            y1={segment.innerY}
            x2={segment.outerX}
            y2={segment.outerY}
            stroke="currentColor"
            strokeOpacity="0.3"
          />
          <path
            d={segment.path}
            transform={segment.transform}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      <g fill="none" strokeLinecap="round">
        <path d="M100 48 L72 126 L137 126 L58 76 L109 142 Z" stroke="#F6E7A1" strokeOpacity="0.48" />
        <path d="M46 111 L126 90 L72 126 M58 76 L137 126" stroke="#F6E7A1" strokeOpacity="0.32" />
        <path d="M100 48 L46 111 L109 142 M126 90 L109 142" stroke="#fff" strokeOpacity="0.16" strokeDasharray="3 3" />
      </g>

      {PLANETS.map((planet) => (
        <g key={planet.glyph}>
          <circle cx={planet.x} cy={planet.y} r="8" fill="#0a1856" stroke="#F6E7A1" strokeOpacity="0.55" />
          <text
            x={planet.x}
            y={planet.y + 0.5}
            fill="#f4efe8"
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {planet.glyph}
          </text>
        </g>
      ))}
      <circle cx="100" cy="100" r="2.5" fill="#F6E7A1" />
    </svg>
  );
}

function PortraitPreview() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col bg-[#050d4a] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[#F6E7A1]/20 pb-4">
        <span className="font-display text-lg text-white">Твой портрет</span>
        <span className="rounded-full border border-[#F6E7A1]/40 bg-[#F6E7A1]/12 px-3 py-1 text-[10px] text-[#F6E7A1]">
          Натальная карта
        </span>
      </div>
      <div className="grid flex-1 gap-3 pt-4 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-[1.4rem] border border-[#F6E7A1]/25 bg-[#071240]">
          <BirthChart />
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-[1.25rem] border border-[#F6E7A1]/25 bg-white/[0.04] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Сильная сторона</p>
            <p className="mt-2 font-display text-base leading-tight text-white">
              Ты видишь связи там, где другие замечают только детали.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-[#F6E7A1]/25 bg-white/[0.04] p-3.5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#F6E7A1]">Текущий цикл</p>
              <p className="mt-2 font-display text-sm leading-tight text-white">Юпитер во Льве</p>
              <p className="mt-2 text-[10px] leading-relaxed text-white/55">
                Фокус на смелом самовыражении, творчестве и праве занимать больше места.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#F6E7A1]/35 bg-[#F6E7A1]/08 p-3.5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#F6E7A1]">Паттерн</p>
              <p className="mt-2 font-display text-sm leading-tight text-white">Сначала уверенность, потом шаг</p>
              <p className="mt-2 text-[10px] leading-relaxed text-white/55">
                Перед важным выбором ты долго ищешь подтверждение, что всё получится.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerspectivePreview() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col bg-[#050d4a] p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-white">Кто я?</span>
        <span className="text-xs text-white/40">02 августа</span>
      </div>
      <div className="mt-5 rounded-[1.5rem] border border-[#F6E7A1]/30 bg-white/[0.04] p-5">
        <p className="text-xs leading-relaxed text-white/50">Тема, которая возвращается</p>
        <p className="mt-2 font-display text-xl leading-snug text-white">
          Ты ищешь определённость до того, как разрешаешь себе двигаться.
        </p>
      </div>
      <div className="mt-3 grid flex-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[1.4rem] border border-[#F6E7A1]/35 bg-[#F6E7A1]/08 p-4">
          <p className="text-xs text-[#F6E7A1]">Что стоит проверить</p>
          <p className="mt-5 text-sm leading-relaxed text-white/75">
            Где осторожность действительно защищает тебя, а где становится способом отложить выбор?
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-[1.4rem] border border-[#F6E7A1]/25 bg-[#071240] p-4">
          <div className="flex gap-2">
            {["свобода", "отношения", "контроль"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#F6E7A1]/25 bg-[#F6E7A1]/10 px-2.5 py-1 text-[9px] text-[#F6E7A1]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div>
            <p className="text-xs text-white/40">Новая гипотеза</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Сравни её со своим опытом, а не принимай как готовый ответ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessPreview() {
  return (
    <div className="flex h-full min-h-[20rem] bg-[#050d4a] p-3 sm:p-4">
      <aside className="flex w-16 shrink-0 flex-col items-center rounded-[1.25rem] border border-[#F6E7A1]/25 bg-[#071240] py-4">
        <span className="h-7 w-7 rounded-full bg-[#F6E7A1] shadow-[0_0_18px_rgba(246,231,161,0.45)]" />
        <div className="mt-8 flex flex-col gap-4">
          {[true, false, false, false].map((active, index) => (
            <span
              key={index}
              className={`h-7 w-7 rounded-lg ${
                active ? "bg-[#F6E7A1]/20 border border-[#F6E7A1]/45" : "border border-white/15"
              }`}
            />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-2 pl-4 sm:p-3 sm:pl-5">
        <div>
          <p className="text-xs text-white/40">Сегодня</p>
          <p className="mt-1 font-display text-xl text-white">Что происходит сейчас?</p>
        </div>
        <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
          <div className="col-span-2 rounded-[1.35rem] border border-[#F6E7A1]/35 bg-[#F6E7A1]/08 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#F6E7A1]">Текущий цикл</p>
            <p className="mt-2 font-display text-lg text-white">Время пересобрать привычный ритм</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-[#F6E7A1]" />
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-[#F6E7A1]/25 bg-white/[0.04] p-4">
            <p className="text-xs text-white/45">Энергия</p>
            <p className="mt-4 text-2xl text-white">7.2</p>
            <p className="mt-1 text-[10px] text-white/40">сегодня</p>
          </div>
          <div className="rounded-[1.35rem] border border-[#F6E7A1]/25 bg-white/[0.04] p-4">
            <p className="text-xs text-white/45">Наблюдения</p>
            <div className="mt-5 flex items-end gap-1.5">
              {[35, 55, 42, 75, 62].map((height, index) => (
                <span
                  key={index}
                  className="w-2 rounded-full bg-[#F6E7A1]/70"
                  style={{ height: `${height / 2}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PREVIEWS = [PortraitPreview, PerspectivePreview, AccessPreview];

export function WhatYouGet() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ActivePreview = PREVIEWS[activeIndex];

  return (
    <section id="get" className="mt-28 scroll-mt-24">
      <h2 className="text-center font-display text-3xl leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
        Что ты <span className="font-display italic text-[#F6E7A1]">получишь</span>
      </h2>

      <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-expanded={isActive}
                  aria-controls={`what-you-get-panel-${index}`}
                  className="flex min-h-20 w-full items-center gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1]"
                >
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg transition-all duration-300 ${
                      isActive
                        ? "rotate-45 border-[#F6E7A1] bg-[#F6E7A1] text-[#0a1a3a]"
                        : "border-white/20 text-white/55"
                    }`}
                  >
                    +
                  </span>
                  <span
                    className={`font-display text-xl leading-tight transition-colors md:text-2xl ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {item.title}
                  </span>
                </button>
                <div
                  id={`what-you-get-panel-${index}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                    isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pl-12 text-sm leading-relaxed text-white/65 md:text-base">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative min-h-[20rem] overflow-hidden rounded-2xl border border-[#F6E7A1]/55 bg-[#050d4a] sm:aspect-[4/3]">
          <div
            key={activeIndex}
            className="h-full animate-[fade-up_0.55s_cubic-bezier(0.22,1,0.36,1)_both]"
          >
            <ActivePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
