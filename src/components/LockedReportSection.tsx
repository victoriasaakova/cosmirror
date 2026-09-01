"use client";

import Image from "next/image";

export function LockedReportSection({
  onUnlock,
}: {
  section: string;
  onUnlock: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="w-full overflow-hidden rounded-2xl border border-[#F6E7A1]/45 bg-[var(--background)] text-left transition duration-200 ease-out active:scale-[0.99] lg:flex lg:h-full lg:min-h-0 lg:flex-col"
    >
      <div className="relative aspect-[21/9] max-h-32 w-full overflow-hidden lg:aspect-auto lg:max-h-none lg:min-h-[8rem] lg:flex-1">
        <Image
          src="/images/report.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 45rem"
        />
      </div>
      <div className="px-5 py-4 lg:shrink-0">
        <h2 className="text-[1.45rem] font-normal leading-[1.15] tracking-tight text-white sm:text-[1.65rem]">
          Открыть{" "}
          <span className="font-display italic text-[#F6E7A1]">все разделы</span>
        </h2>
        <p className="mt-2 text-[15px] leading-snug text-white/75">
          Чтение карты, аспекты, циклы, запрос и практика — в одном персональном разборе.
        </p>
        <span className="cabinet-cta mt-4 w-full min-h-11">Узнать больше</span>
      </div>
    </button>
  );
}
