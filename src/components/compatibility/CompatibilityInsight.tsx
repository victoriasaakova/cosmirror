import Image from "next/image";

export function CompatibilityInsight() {
  return (
    <section className="mx-auto mt-16 flex max-w-3xl flex-col items-center px-1 text-center sm:mt-20" aria-labelledby="insight-quote">
      <Image
        src="/images/eye-silver.webp"
        alt=""
        width={512}
        height={512}
        className="animate-eye-spin h-auto w-[min(42vw,11rem)] sm:w-[min(36vw,13rem)] md:w-[14rem]"
        sizes="(max-width: 768px) 42vw, 14rem"
      />
      <h2
        id="insight-quote"
        className="mt-8 font-grotesk text-2xl font-normal leading-snug text-white sm:text-[1.7rem] md:text-3xl"
      >
        Отношения между двумя людьми — отдельный живой организм и каждая связь{" "}
        <span className="font-display italic text-[#F6E7A1]">уникальна</span>.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
        Часто мы смотрим на другого через линзу несказанных ожиданий, и призраков прошлого опыта. Поэтому так
        важно иногда отойти в сторону и заметить пространство, которое разворачивается между тобой и другим
        человеком прямо сейчас.
      </p>
    </section>
  );
}
