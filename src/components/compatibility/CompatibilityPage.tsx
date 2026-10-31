"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { CompatibilityPreloader } from "@/components/StarCheckPreloader";
import { toIsoDate } from "@/lib/birth-input";
import { loadLiveCompatibility } from "@/lib/compatibility/live-provider";
import type {
  CompatibilityRequest,
  CompatibilityResult,
  PersonDraft,
  RelationshipKind,
  RelationshipStage,
} from "@/lib/compatibility/types";
import { CompatibilityHero } from "@/components/compatibility/CompatibilityHero";
import { CompatibilityInsight } from "@/components/compatibility/CompatibilityInsight";
import { CompatibilityReading } from "@/components/compatibility/CompatibilityReading";
import { CoupleInput } from "@/components/compatibility/CoupleInput";
import { ReadingResult } from "@/components/compatibility/ReadingResult";

type Status = "empty" | "editing" | "loading" | "results" | "error";

export type CompatibilityDevPreset = {
  people: [PersonDraft, PersonDraft];
  relationshipKind: RelationshipKind;
  relationshipStage: RelationshipStage | null;
};

let devPresetLoad: Promise<CompatibilityResult> | null = null;

function loadDevPreset(preset: CompatibilityDevPreset) {
  if (!devPresetLoad) {
    devPresetLoad = loadLiveCompatibility(
      toRequest(preset.people, preset.relationshipKind, preset.relationshipStage),
    ).catch((err) => {
      devPresetLoad = null;
      throw err;
    });
  }
  return devPresetLoad;
}

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

function toRequest(
  people: [PersonDraft, PersonDraft],
  relationshipKind: RelationshipKind | null,
  relationshipStage: RelationshipStage | null,
): CompatibilityRequest {
  return {
    relationshipType: relationshipKind || "romantic",
    relationshipStatus: statusFor(relationshipKind, relationshipStage),
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

function statusFor(kind: RelationshipKind | null, stage: RelationshipStage | null) {
  if (!kind || !stage) return undefined;
  if (kind === "romantic") return { meeting: "dating", together: "together", past: "ended" }[stage];
  if (kind === "friendship") return { meeting: "new", together: "close", past: "ended" }[stage];
  return { meeting: "active", together: "active", past: "distant" }[stage];
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

export function CompatibilityPage({ devPreset }: { devPreset?: CompatibilityDevPreset } = {}) {
  const [status, setStatus] = useState<Status>(devPreset ? "loading" : "empty");
  const [people, setPeople] = useState<[PersonDraft, PersonDraft]>(
    () => devPreset?.people ?? blankPeople(),
  );
  const [relationshipKind, setRelationshipKind] = useState<RelationshipKind | null>(
    devPreset?.relationshipKind ?? null,
  );
  const [relationshipStage, setRelationshipStage] = useState<RelationshipStage | null>(
    devPreset?.relationshipStage ?? null,
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const showForm = status === "editing" || status === "error" || status === "empty";
  const names = {
    A: result?.persons[0].displayName ?? displayName(people[0]),
    B: result?.persons[1].displayName ?? displayName(people[1]),
  };

  useEffect(() => {
    if (status === "results") window.scrollTo(0, 0);
  }, [status]);

  useEffect(() => {
    if (!devPreset) return;
    let cancelled = false;
    loadDevPreset(devPreset)
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setStatus("results");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не получилось собрать разбор. Можно попробовать ещё раз.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [devPreset]);

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
    try {
      const next = await loadLiveCompatibility(toRequest(people, relationshipKind, relationshipStage));
      setResult(next);
      setStatus("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось собрать разбор. Можно попробовать ещё раз.");
      setStatus("error");
    }
  }

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
        ) : null}

        {status === "loading" ? (
          <div className="mt-16">
            <CompatibilityPreloader />
          </div>
        ) : null}

        {status === "results" && result ? (
          <ReadingResult
            people={people}
            result={result}
            names={names}
            relationshipKind={relationshipKind}
            relationshipStage={relationshipStage}
          />
        ) : null}
      </div>
    </main>
  );
}
