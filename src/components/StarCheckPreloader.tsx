"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export const PRELOADER_LEDE =
  "mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white sm:text-lg";

export function StarCheckPreloader() {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src="/images/eye-silver.webp"
        alt=""
        width={512}
        height={512}
        className="animate-eye-spin h-auto w-[min(46vw,11rem)] sm:w-[12rem]"
        sizes="(max-width: 640px) 46vw, 12rem"
        priority
      />
      <h2 className="mt-8 font-display text-3xl font-normal italic leading-snug tracking-normal text-[#F6E7A1] sm:text-4xl md:text-[2.6rem]">
        сверяемся со&nbsp;звёздами
      </h2>
      <p className="mt-3 font-grotesk text-base font-normal text-white sm:text-lg">
        скоро все откроется
      </p>
    </div>
  );
}

const GENERATING_STATUS = [
  "интерпретирую карту...",
  "смотрю аспекты...",
  "считаю циклы...",
  "нахожу связь с запросом...",
  "формирую шаги для практики...",
];

export function ReportSectionPreloader() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % GENERATING_STATUS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src="/images/eye-silver.webp"
        alt=""
        width={512}
        height={512}
        className="animate-eye-spin h-auto w-[min(46vw,11rem)] sm:w-[12rem]"
        sizes="(max-width: 640px) 46vw, 12rem"
        priority
      />
      <h2 className="mt-8 text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl">
        отчёт{" "}
        <span className="font-display italic text-[#F6E7A1]">формируется</span>
      </h2>
      <p className="mt-3 font-grotesk text-base font-normal text-white sm:text-lg">
        {GENERATING_STATUS[index]}
      </p>
    </div>
  );
}

export function StarCheckPreloaderPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a]">
      <Image
        src="/images/hero-coastal-moon-trail_4.webp"
        alt=""
        fill
        priority
        className="object-cover object-[center_68%]"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050d4a]/85 via-[#050d4a]/55 to-[#050d4a]/75"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050d4a]/90"
      />
      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col">
        <StarCheckPreloader />
      </div>
    </div>
  );
}
