"use client";

import { useState } from "react";
import Image from "next/image";
import { aspectGlyph, planetGlyph } from "@/lib/astro-glyphs";
import type {
  CompatibilityResult,
  PersonDraft,
  PersonId,
  RelationshipKind,
  RelationshipStage,
} from "@/lib/compatibility/types";
import { PairCard } from "@/components/compatibility/PairCard";
import { glassFrameClass } from "@/components/compatibility/styles";
import {
  buildReadingModel,
  type DeepTopic,
  type GlyphPair,
} from "@/components/compatibility/reading-model";

type Props = {
  people: [PersonDraft, PersonDraft];
  result: CompatibilityResult;
  names: Record<PersonId, string>;
  relationshipKind: RelationshipKind | null;
  relationshipStage: RelationshipStage | null;
};

export function ReadingResult({ people, result, names, relationshipKind, relationshipStage }: Props) {
  const model = buildReadingModel(result, names, relationshipKind, relationshipStage);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  return (
    <div className="mt-8 select-text">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance font-grotesk text-4xl font-normal leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
          Результат{" "}
          <span className="font-display italic tracking-normal text-[#F6E7A1]">совместимости</span>
        </h1>
      </header>

      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:mt-16 sm:gap-5">
        {people.map((person) => (
          <article key={person.id} className={`${glassFrameClass} px-4 py-4 text-center sm:px-5 sm:py-5`}>
            <h2 className="font-display text-2xl italic leading-none text-[#F6E7A1] sm:text-3xl">
              {names[person.id]}
            </h2>
            <p className="mt-2 text-sm leading-snug text-white/80 sm:text-base">{personLine(person)}</p>
          </article>
        ))}
      </div>

      <section className={`${blockGap} mx-auto max-w-3xl`} aria-labelledby="now-insight-title">
        <h2 id="now-insight-title" className={sectionTitleClass}>
          <InsightTitle title={model.insightTitle} />
        </h2>
        <p className="mx-auto mt-8 max-w-[68ch] text-center text-base leading-relaxed text-white/80 sm:mt-10 sm:text-[1.05rem]">
          {model.insightText}
        </p>
      </section>

      <div className={`${blockGap} grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8`}>
        {model.metrics.map((metric) => (
          <article key={metric.id} className={`${glassFrameClass} px-5 py-6 text-center sm:px-7 sm:py-7`}>
            <p
              className="font-display text-5xl italic leading-none tracking-normal text-[#F6E7A1] sm:text-6xl"
              aria-label={metric.value == null ? "Процент пока не посчитан" : `${Math.round(metric.value)} процентов`}
            >
              {metric.value == null ? "—%" : `${Math.round(metric.value)}%`}
            </p>
            <h2 className="mt-4 text-balance font-grotesk text-xl font-normal leading-snug text-white sm:text-2xl">
              {metric.title} {metric.accent}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">{metric.text}</p>
          </article>
        ))}
      </div>

      <PairCard card={result.pairCard} names={names} />

      <section className={blockGap} aria-labelledby="deep-title">
        <h2 id="deep-title" className={sectionTitleClass}>
          Глубокий <span className={accentClass}>разбор</span>
        </h2>
        <ul className="mx-auto mt-12 grid max-w-3xl list-none grid-cols-1 gap-16 sm:mt-14">
          {model.topics.map((topic) => (
            <li key={topic.id}>
              <h3 className="mb-3 text-balance text-center font-grotesk text-sm font-normal text-white/60">
                {topicLabel(topic)}
              </h3>
              <DeepCard
                topic={topic}
                open={openTopic === topic.id}
                onToggle={() => setOpenTopic((current) => (current === topic.id ? null : topic.id))}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className={`${blockGap} text-center`} aria-labelledby="conclusion-title">
        <Image
          src="/images/contact-star.png"
          alt=""
          width={571}
          height={992}
          className="mx-auto mb-5 h-20 w-auto sm:h-24"
        />
        <h2 id="conclusion-title" className={sectionTitleClass}>
          {model.conclusionLead} <span className={accentClass}>{model.conclusionAccent}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[68ch] text-center text-base leading-relaxed text-white/80 sm:text-[1.05rem]">
          {model.conclusionText}
        </p>
      </section>

      <section className={blockGap} aria-labelledby="cycles-title">
        <h2 id="cycles-title" className={sectionTitleClass}>
          Персональные <span className={accentClass}>циклы</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[62ch] text-center text-base leading-relaxed text-white/80 sm:text-lg">
          Что сейчас происходит у каждого из вас?
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {model.cycles.map((cycle) => (
            <article key={cycle.personId} className={`${glassFrameClass} px-5 py-6 text-center sm:px-7 sm:py-7`}>
              <h3 className="font-grotesk text-xl font-normal text-white sm:text-2xl">
                <span className={accentClass}>{cycle.name}</span>
              </h3>
              <p className="mt-3 text-base leading-relaxed text-white sm:text-lg">{cycle.title}</p>
              {cycle.period ? <p className="mt-2 text-sm text-[#F6E7A1]/80">{cycle.period}</p> : null}
              <p className="mt-4 text-base leading-relaxed text-white/80">{cycle.text}</p>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

const blockGap = "mt-24 sm:mt-32";

const sectionTitleClass =
  "text-balance text-center font-grotesk text-3xl font-normal leading-[1.12] tracking-[-0.03em] text-white md:text-5xl";

const accentClass = "font-display italic tracking-normal text-[#F6E7A1]";

const TITLE_PREPOSITIONS = new Set([
  "в",
  "во",
  "на",
  "к",
  "ко",
  "для",
  "с",
  "со",
  "от",
  "из",
  "по",
  "о",
  "об",
  "про",
  "между",
  "через",
  "до",
  "без",
  "при",
]);

function InsightTitle({ title }: { title: string }) {
  const { lead, accent } = splitInsightTitle(title);
  if (!accent) return title;
  return (
    <>
      {lead ? `${lead} ` : null}
      <span className={accentClass}>{accent}</span>
    </>
  );
}

function splitInsightTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { lead: "", accent: words[0] || "" };
  if (words.length === 2) return { lead: words[0], accent: words[1] };
  for (let index = words.length - 2; index >= 2; index -= 1) {
    const token = words[index].toLowerCase().replace(/^[«"„]+|[»"“.,:;!?]+$/g, "");
    const accentLength = words.length - index;
    if (TITLE_PREPOSITIONS.has(token) && accentLength >= 2 && accentLength <= 4) {
      return { lead: words.slice(0, index).join(" "), accent: words.slice(index).join(" ") };
    }
  }
  let accentStart = words.length - 2;
  const conjunctions = new Set(["и", "а", "но", "или", "да"]);
  const first = words[accentStart].toLowerCase().replace(/^[«"„]+|[»"“.,:;!?]+$/g, "");
  if (conjunctions.has(first) && accentStart > 1) accentStart -= 1;
  return { lead: words.slice(0, accentStart).join(" "), accent: words.slice(accentStart).join(" ") };
}

function personLine(person: PersonDraft) {
  const time = person.unknownTime ? "" : person.birthTime.trim();
  return [person.birthDate.trim(), time, person.placeName.trim()].filter(Boolean).join(" • ");
}

function GlyphRow({ glyphs }: { glyphs: GlyphPair[] }) {
  if (!glyphs.length) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-hidden>
      {glyphs.map((glyph) => (
        <span
          key={glyph.id}
          className="natal-astro-glyph inline-flex items-baseline gap-1 text-xl leading-none text-[#F6E7A1]"
        >
          <span>{planetGlyph(glyph.pointA)}</span>
          {glyph.aspect ? <span>{aspectGlyph(glyph.aspect)}</span> : null}
          {glyph.pointB ? <span>{planetGlyph(glyph.pointB)}</span> : null}
        </span>
      ))}
    </div>
  );
}

function topicLabel(topic: DeepTopic) {
  return [topic.title, topic.accent].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function DeepCard({ topic, open, onToggle }: { topic: DeepTopic; open: boolean; onToggle: () => void }) {
  const panelId = `${topic.id}-astro`;
  const hasAstro = topic.astro.length > 0;
  return (
    <article className={`${glassFrameClass} flex flex-col px-5 py-6 sm:px-7 sm:py-7`}>
      <GlyphRow glyphs={topic.glyphs} />
      {topic.insight ? (
        <h4 className="text-balance text-center font-grotesk text-xl font-normal leading-snug text-white sm:text-2xl">
          {topic.insight}
        </h4>
      ) : null}
      {topic.paragraphs.length ? (
        <div className="mt-4 space-y-3">
          {topic.paragraphs.map((paragraph) => (
            <p key={paragraph.text} className="text-base leading-relaxed text-white/80">
              {paragraph.text}
            </p>
          ))}
        </div>
      ) : topic.preview ? (
        <p className="mt-4 text-base leading-relaxed text-white/80">{topic.preview}</p>
      ) : null}
      {hasAstro ? (
        <div className="mt-auto pt-4">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Скрыть разбор по планетам" : "Показать разбор по планетам"}
            onClick={onToggle}
            className="flex w-full items-center justify-between gap-3 pt-1 text-left font-grotesk text-base text-[#F6E7A1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1]"
          >
            где это проявляется
            <svg
              viewBox="0 0 20 20"
              className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open ? (
            <div id={panelId} className="mt-3 space-y-3">
              {topic.astro.map((line) => (
                <p key={line} className="text-base leading-relaxed text-white/80">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
