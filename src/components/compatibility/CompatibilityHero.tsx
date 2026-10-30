import Image from "next/image";
import { goldButtonClass } from "@/components/compatibility/styles";

export function CompatibilityHero() {
  return (
    <header className="mx-auto w-full text-center">
      <Image
        src="/images/compatibility-heart.webp"
        alt=""
        width={1024}
        height={935}
        priority
        className="mx-auto h-auto w-[min(78vw,20rem)] sm:w-[22rem]"
        sizes="(max-width: 640px) 78vw, 22rem"
      />
      <h1 className="mt-2 font-grotesk text-4xl font-normal leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:whitespace-nowrap lg:text-[clamp(2.15rem,3.6vw,3.75rem)]">
        Астрологическая{" "}
        <br className="lg:hidden" />
        <span className="font-display italic leading-[1.15] tracking-normal text-[#F6E7A1]">
          совместимость
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
        Исследуй свои отношения по натальной карте.
      </p>
      <div className="mt-8 flex justify-center">
        <a href="#compatibility-check" className={`${goldButtonClass} cursor-pointer`}>
          Проверить совместимость
        </a>
      </div>
    </header>
  );
}
