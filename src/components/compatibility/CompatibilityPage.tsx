"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { CompatibilityPreloader } from "@/components/StarCheckPreloader";
import { toIsoDate } from "@/lib/birth-input";
import { loadLiveCompatibility } from "@/lib/compatibility/live-provider";
import type {
  CompatibilityRequest,
  CompatibilityResult,
  NatalRow,
  PersonDraft,
  RelationshipKind,
  RelationshipStage,
} from "@/lib/compatibility/types";
import { signLabel } from "@/components/compatibility/astro-label";
import { CompatibilityHero } from "@/components/compatibility/CompatibilityHero";
import { CompatibilityInsight } from "@/components/compatibility/CompatibilityInsight";
import { CompatibilityReading } from "@/components/compatibility/CompatibilityReading";
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

function blankPeople(): [PersonDraft, PersonDraft] {
  return [
    {
      id: "A",
      displayName: "",
      birthDate: "",
      birthTime: "",
      unknownTime: false,
      placeName: "",
      latitude: null,
      longitude: null,
      timezone: "",
    },
    {
      id: "B",
      displayName: "",
      birthDate: "",
      birthTime: "",
      unknownTime: false,
      placeName: "",
      latitude: null,
      longitude: null,
      timezone: "",
    },
  ];
}

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

function validate(
  people: [PersonDraft, PersonDraft],
  relationshipKind: RelationshipKind | null,
  relationshipStage: RelationshipStage | null,
) {
  if (people.some((person) => !toIsoDate(person.birthDate))) return "Нужна дата рождения у обоих.";
  if (people.some((person) => person.placeName.trim().length < 2)) return "Нужен город рождения у обоих.";
  if (people.some((person) => person.latitude == null || person.longitude == null || !person.timezone)) {
    return "Выбери город из списка, чтобы взять координаты.";
  }
  if (!relationshipKind) return "Выбери тип отношений.";
  if (relationshipKind === "romantic" && !relationshipStage) return "Выбери статус отношений.";
  return "";
}

export function CompatibilityPage() {
  const [status, setStatus] = useState<Status>("empty");
  const [people, setPeople] = useState<[PersonDraft, PersonDraft]>(blankPeople);
  const [relationshipKind, setRelationshipKind] = useState<RelationshipKind | null>(null);
  const [relationshipStage, setRelationshipStage] = useState<RelationshipStage | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [aspectsOpen, setAspectsOpen] = useState(false);
  const showForm = status === "editing" || status === "error" || status === "empty";
  const names = {
    A: result?.persons[0].displayName ?? displayName(people[0]),
    B: result?.persons[1].displayName ?? displayName(people[1]),
  };

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

  function noteInteraction() {
    if (status === "empty") setStatus("editing");
    if (status === "error") {
      setStatus("editing");
      setError("");
    }
  }

  function selectRelationshipKind(kind: RelationshipKind) {
    setRelationshipKind(kind);
    if (kind !== "romantic") setRelationshipStage(null);
    noteInteraction();
  }

  function selectRelationshipStage(stage: RelationshipStage) {
    setRelationshipStage(stage);
    noteInteraction();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(people, relationshipKind, relationshipStage);
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
      <Header />
      {showForm ? (
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
      ) : null}
      <div
        className={`relative z-10 mx-auto w-full px-5 pb-24 pt-24 sm:px-8 md:pt-28 ${
          showForm ? "max-w-6xl" : "max-w-5xl"
        }`}
      >
        {showForm ? (
          <div className="mt-8">
            <CompatibilityHero />
            <CompatibilityReading />
            <CompatibilityInsight />
            <CoupleInput
              people={people}
              relationshipKind={relationshipKind}
              relationshipStage={relationshipStage}
              error={error}
              onChange={updatePerson}
              onRelationshipKind={selectRelationshipKind}
              onRelationshipStage={selectRelationshipStage}
              onSubmit={onSubmit}
            />
            <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-white/55 sm:mt-12">
              Это не предсказание и не вердикт вашим отношениям, информация носит ознакомительный характер.
            </p>
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
          <div className="mt-6">
            <CompatibilityPreloader />
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
    </main>
  );
}
