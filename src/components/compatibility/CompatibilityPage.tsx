"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toIsoDate } from "@/lib/birth-input";
import { loadLiveCompatibility } from "@/lib/compatibility/live-provider";
import type { CompatibilityRequest, CompatibilityResult, NatalRow, PersonDraft } from "@/lib/compatibility/types";
import { signLabel } from "@/components/compatibility/astro-label";
import { CompatibilityHero } from "@/components/compatibility/CompatibilityHero";
import { BondSection } from "@/components/compatibility/BondSection";
import { CoupleCycleInsight } from "@/components/compatibility/CoupleCycleInsight";
import { CoupleInput } from "@/components/compatibility/CoupleInput";
import { IndividualCycleCard } from "@/components/compatibility/IndividualCycleCard";
import { PairStories } from "@/components/compatibility/PairStories";
import { SignComparisons } from "@/components/compatibility/SignComparisons";
import { SynastryAspectCard } from "@/components/compatibility/SynastryAspectCard";
import { UpcomingCycles } from "@/components/compatibility/UpcomingCycles";
import { SignsTable, type SignsTablePoint } from "@/components/SignsTable";

type Status = "empty" | "editing" | "loading" | "results" | "error";

const DEMO_PEOPLE: [PersonDraft, PersonDraft] = [
  {
    id: "A",
    displayName: "Виктория",
    birthDate: "26.05.1995",
    birthTime: "19:25",
    unknownTime: false,
    placeName: "Гдыня, Польша",
    latitude: 54.516498,
    longitude: 18.540274,
    timezone: "Europe/Warsaw",
  },
  {
    id: "B",
    displayName: "Марк",
    birthDate: "14.02.1993",
    birthTime: "08:40",
    unknownTime: false,
    placeName: "Рим, Италия",
    latitude: 41.902783,
    longitude: 12.496366,
    timezone: "Europe/Rome",
  },
];

function displayName(person: PersonDraft) {
  const fallback = person.id === "A" ? "Ты" : "Партнёр";
  const name = person.displayName.trim();
  return name || fallback;
}

function tablePoints(rows: NatalRow[], side: "a" | "b"): SignsTablePoint[] {
  return rows.flatMap((row) => {
    const placement = row[side];
    if (!placement?.sign) return [];
    return [
      {
        key: placement.point,
        sign: placement.sign,
        sign_ru: signLabel(placement.sign),
        degree: placement.degree ?? undefined,
      },
    ];
  });
}

function PageMark() {
  return (
    <Link
      href="/"
      aria-label="Cosmirror"
      className="inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1]"
    >
      <Image
        src="/images/eye-silver.webp"
        alt=""
        width={512}
        height={512}
        priority
        className="h-auto w-16 sm:w-20"
      />
    </Link>
  );
}

function BirthCards({ people }: { people: [PersonDraft, PersonDraft] }) {
  return (
    <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 text-left">
      {people.map((person) => (
        <article key={person.id} className="rounded-2xl border border-[#F6E7A1]/40 bg-white/[0.07] px-4 py-4">
          <p className="font-display text-xl italic leading-none text-[#F6E7A1]">{displayName(person)}</p>
          <p className="mt-3 font-grotesk text-base text-white">{person.birthDate}</p>
        </article>
      ))}
    </div>
  );
}

function toRequest(people: [PersonDraft, PersonDraft]): CompatibilityRequest {
  return {
    relationshipType: "romantic",
    persons: people.map((person) => {
      const timeKnown = !person.unknownTime && person.birthTime.trim().length > 0;
      return {
        id: person.id,
        displayName: displayName(person),
        birthDate: toIsoDate(person.birthDate),
        birthTime: timeKnown ? person.birthTime : null,
        birthTimeStatus: timeKnown ? "known" : "unknown",
        placeName: person.placeName.trim(),
        latitude: person.latitude,
        longitude: person.longitude,
        timezone: person.timezone,
      };
    }) as CompatibilityRequest["persons"],
  };
}

function validate(people: [PersonDraft, PersonDraft]) {
  if (people.some((person) => !toIsoDate(person.birthDate))) return "Нужна дата рождения у обоих.";
  if (people.some((person) => person.placeName.trim().length < 2)) return "Нужен город рождения у обоих.";
  if (people.some((person) => person.latitude == null || person.longitude == null || !person.timezone)) {
    return "Выбери город из списка, чтобы взять координаты.";
  }
  return "";
}

export function CompatibilityPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [people, setPeople] = useState<[PersonDraft, PersonDraft]>(DEMO_PEOPLE);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [aspectsOpen, setAspectsOpen] = useState(false);
  const showForm = status === "editing" || status === "error" || status === "empty";
  const names = {
    A: result?.persons[0].displayName ?? displayName(people[0]),
    B: result?.persons[1].displayName ?? displayName(people[1]),
  };

  useEffect(() => {
    let cancelled = false;
    loadLiveCompatibility(toRequest(DEMO_PEOPLE))
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setStatus("results");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не получилось собрать разбор. Можно попробовать ещё раз.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updatePerson(next: PersonDraft) {
    setPeople((current) => {
      const copy: [PersonDraft, PersonDraft] = [...current];
      copy[next.id === "A" ? 0 : 1] = next;
      return copy;
    });
    if (status === "empty") setStatus("editing");
    if (status === "error") {
      setStatus("editing");
      setError("");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(people);
    if (problem) {
      setError(problem);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    setAspectsOpen(false);
    try {
      const next = await loadLiveCompatibility(toRequest(people));
      setResult(next);
      setStatus("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось собрать разбор. Можно попробовать ещё раз.");
      setStatus("error");
    }
  }

  const primaryAspects = result?.aspects.filter((aspect) => aspect.primary) ?? [];
  const extraAspects = result?.aspects.filter((aspect) => !aspect.primary) ?? [];
  const chartReady = result?.natalRows.some((row) => row.a || row.b) ?? false;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#050d4a] text-white">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <div className="flex justify-center">
          <PageMark />
        </div>

        {showForm ? (
          <div className="mt-8">
            <CompatibilityHero />
            <CoupleInput
              people={people}
              error={error}
              onChange={updatePerson}
              onSubmit={onSubmit}
            />
          </div>
        ) : (
          <header className="mx-auto mt-8 flex max-w-3xl flex-col items-center text-center">
            <h1 className="font-display text-5xl italic leading-[1.08] text-[#F6E7A1] md:text-6xl">
              {names.A}
              <span className="mx-3 font-grotesk text-3xl not-italic text-white/80 md:text-4xl">и</span>
              {names.B}
            </h1>
            {result?.overview.title ? (
              <p className="mt-5 max-w-md font-display text-2xl italic leading-snug text-white md:text-3xl">
                {result.overview.title}
              </p>
            ) : null}
            <BirthCards people={people} />
            {result?.warnings.length ? (
              <ul className="mt-6 max-w-[65ch] space-y-1 text-left text-sm text-white/70">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            {status === "results" ? (
              <button
                type="button"
                onClick={() => setStatus("editing")}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-[#F6E7A1]/45 px-6 py-2 text-base text-[#F6E7A1] transition-colors hover:bg-[#F6E7A1]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1]"
              >
                Изменить
              </button>
            ) : null}
          </header>
        )}

        {status === "loading" ? (
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2" aria-hidden>
            <div className="motion-safe:animate-pulse h-40 rounded-2xl border border-white/10 bg-white/[0.04]" />
            <div className="motion-safe:animate-pulse h-40 rounded-2xl border border-white/10 bg-white/[0.04]" />
          </div>
        ) : null}

        {status === "results" && result ? (
          <>
            <PairStories cards={result.bondSummary} />
            <BondSection bonds={result.bonds} />

            {result.cycles.background || result.cycles.active.length || result.cycles.couple.text ? (
            <section className="mt-20" aria-labelledby="now-title">
              <h2
                id="now-title"
                className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
              >
                Ваши отношения сейчас
              </h2>
              {result.cycles.background ? (
                <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-white/80">{result.cycles.background}</p>
              ) : null}
              {result.cycles.active.length ? (
                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {result.cycles.active.map((cycle) => (
                    <IndividualCycleCard key={cycle.personId} cycle={cycle} personName={names[cycle.personId]} />
                  ))}
                </div>
              ) : null}
              {result.cycles.couple.text ? (
                <div className="mt-3">
                  <CoupleCycleInsight cycle={result.cycles.couple} />
                </div>
              ) : null}
            </section>
            ) : null}

            {result.cycles.upcoming.length ? (
            <section className="mt-20" aria-labelledby="next-title">
              <h2
                id="next-title"
                className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
              >
                Что меняется дальше
              </h2>
              <div className="mt-10">
                <UpcomingCycles cycles={result.cycles.upcoming} names={names} />
              </div>
            </section>
            ) : null}

            <SignComparisons rows={result.signComparisons} names={names} />

            {chartReady ? (
              <section className="mt-20" aria-labelledby="chart-title">
                <h2
                  id="chart-title"
                  className="font-grotesk text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
                >
                  Астрологическая карта пары
                </h2>
                <div className="mt-10 grid gap-10 md:grid-cols-2">
                  <div>
                    <h3 className="font-grotesk text-2xl font-normal text-white">{names.A}</h3>
                    <SignsTable points={tablePoints(result.natalRows, "a")} hasBirthTime={false} />
                  </div>
                  <div>
                    <h3 className="font-grotesk text-2xl font-normal text-white">{names.B}</h3>
                    <SignsTable points={tablePoints(result.natalRows, "b")} hasBirthTime={false} />
                  </div>
                </div>
                {primaryAspects.length > 0 ? (
                  <>
                    <h3 className="mt-14 font-grotesk text-2xl font-normal text-white">Аспекты между картами</h3>
                    <div className="mt-6 space-y-3">
                      {primaryAspects.map((aspect) => (
                        <SynastryAspectCard key={aspect.id} aspect={aspect} names={names} />
                      ))}
                      {aspectsOpen
                        ? extraAspects.map((aspect) => (
                            <SynastryAspectCard key={aspect.id} aspect={aspect} names={names} />
                          ))
                        : null}
                    </div>
                    {extraAspects.length > 0 ? (
                      <button
                        type="button"
                        aria-expanded={aspectsOpen}
                        onClick={() => setAspectsOpen((open) => !open)}
                        className="mt-4 text-base text-[#F6E7A1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6E7A1]"
                      >
                        {aspectsOpen ? "Скрыть остальные аспекты" : "Показать остальные аспекты"}
                      </button>
                    ) : null}
                  </>
                ) : null}
                {result.houseOverlays.length ? (
                  <>
                    <h3 className="mt-14 font-grotesk text-2xl font-normal text-white">Планеты в домах партнёра</h3>
                    <ul className="mt-4 max-w-[65ch] space-y-2 text-base leading-relaxed text-white/80">
                      {result.houseOverlays.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="pointer-events-none relative mt-4 h-[min(100vw,40rem)]">
        <Image
          src="/images/hero-coastal-moon-trail_4.webp"
          alt=""
          fill
          sizes="100vw"
          aria-hidden
          className="object-cover object-center md:object-[center_62%]"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#050d4a] to-transparent" />
      </div>
    </main>
  );
}
