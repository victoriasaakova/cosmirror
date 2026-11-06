import Image from "next/image";
import { goldButtonClass } from "@/components/compatibility/styles";

export function CompatibilityHero() {
  return (
    <header className="mx-auto w-full text-center">
      <div
        className="relative mx-auto aspect-square w-[min(88vw,26rem)] shrink-0 sm:w-[28rem]"
        aria-hidden
      >
        <div className="absolute inset-0 translate-x-[calc(11/1024*100%)] -translate-y-[calc(1/1024*100%)] motion-reduce:translate-none">
          <Image
            src="/images/compatibility-orbit-rings.webp"
            alt=""
            fill
            priority
            className="animate-orbit-spin object-contain motion-reduce:animate-none"
            sizes="(max-width: 640px) 88vw, 28rem"
          />
        </div>
        <div className="absolute inset-[21%]">
          <div className="relative h-full w-full">
            <Image
              src="/images/eye-silver.webp"
              alt=""
              fill
              priority
              className="animate-eye-spin object-contain motion-reduce:animate-none"
              sizes="(max-width: 640px) 50vw, 15rem"
            />
          </div>
        </div>
      </div>
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
