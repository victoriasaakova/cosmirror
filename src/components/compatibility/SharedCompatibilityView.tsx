import Image from "next/image";
import { Header } from "@/components/Header";
import { ReadingResult } from "@/components/compatibility/ReadingResult";
import type { SharedCompatibility } from "@/lib/compatibility/live-provider";
import type { PersonDraft } from "@/lib/compatibility/types";

export function SharedCompatibilityView({ data }: { data: SharedCompatibility | null }) {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#050d4a] text-white">
      <Header />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <Image
          src="/images/compatibility-sky.webp"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-24 sm:px-8 md:pt-28">
        {data ? <SharedReading data={data} /> : <MissingReading />}
      </div>
    </main>
  );
}

function SharedReading({ data }: { data: SharedCompatibility }) {
  return (
    <>
      <ReadingResult
        people={sharePeople(data)}
        result={data.result}
        names={data.names}
        relationshipKind={data.relationshipKind}
        relationshipStage={data.relationshipStage}
      />
      <p className="mx-auto mt-16 max-w-xl text-center text-sm leading-relaxed text-white/55">
        Это не предсказание и не вердикт отношениям. Информация носит ознакомительный характер.
      </p>
    </>
  );
}

function MissingReading() {
  return (
    <div className="mx-auto mt-16 max-w-xl text-center">
      <h1 className="font-grotesk text-4xl font-normal leading-tight text-white sm:text-5xl">
        Разбор <span className="font-display italic text-[#F6E7A1]">не найден</span>
      </h1>
      <p className="mt-4 text-base leading-relaxed text-white/80">Ссылка не открывается. Разбор мог быть удалён или адрес записан с ошибкой.</p>
      <a
        href="/compatibility/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-base font-medium text-[#0a1a3a]"
      >
        Собрать свой разбор
      </a>
    </div>
  );
}

function sharePeople(data: SharedCompatibility): [PersonDraft, PersonDraft] {
  return data.result.persons.map((person) => ({
    id: person.id,
    displayName: person.displayName,
    birthDate: "",
    birthTime: "",
    unknownTime: person.birthTimeStatus !== "known",
    placeName: "",
    latitude: null,
    longitude: null,
    timezone: "",
  })) as [PersonDraft, PersonDraft];
}
