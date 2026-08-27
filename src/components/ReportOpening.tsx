"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { NatalWheel } from "@/components/NatalWheel";
import { formatDms, planetGlyph, signGlyph } from "@/lib/astro-glyphs";
import type { PaidReport } from "@/lib/api";

const CORE = ["sun", "moon", "ascendant"] as const;

const HOUSE_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Солнце, Луна, Асцендент", keys: ["sun", "moon", "ascendant"] },
  { title: "Как работает ум", keys: ["mercury"] },
  { title: "Близость и отношения", keys: ["venus"] },
  { title: "Воля и действие", keys: ["mars"] },
  { title: "Работа и вклад", keys: ["jupiter", "saturn", "midheaven"] },
  { title: "Глубина и сдвиг", keys: ["uranus", "neptune", "pluto"] },
];

type NatalOccupant = {
  key: string;
  name?: string;
  sign?: string;
  sign_ru?: string;
  house?: number | null;
  glyph?: string;
};

type CoreKey = (typeof CORE)[number];

type CorePoint = {
  sign?: string;
  sign_ru?: string;
  degree?: number;
  minute?: number;
  house?: number | null;
  fact?: string;
};

type Props = {
  report: PaidReport;
  displayName: string;
  orderId?: string;
  downloading: boolean;
  onDownloadPdf: () => void;
  actionNote?: string;
};

export function ReportOpening({
  report,
  displayName,
  orderId,
  downloading,
  onDownloadPdf,
  actionNote,
}: Props) {
  const natal = report.document?.factual?.natal;
  const wheel = natal?.wheel;
  const hasBirthTime = Boolean(report.person?.has_birth_time ?? natal?.has_birth_time);
  const canEditTime = !hasBirthTime;
  const [timeOpen, setTimeOpen] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [timeSaved, setTimeSaved] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState("");

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [copied]);

  const birth = useMemo(() => {
    const date = formatBirthDate(report.person?.birth_date);
    const time = formatBirthTime(report.person?.birth_time) || timeSaved;
    const place = (report.person?.birth_place || "").trim();
    return { date, time, place };
  }, [report.person, timeSaved]);

  const core = CORE.map((key) => ({
    key,
    label: coreLabel(key),
    point: findPoint(report, key),
  }));

  async function onShare() {
    const url = shareUrlFor(orderId);
    setShareHint("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setShareHint(url);
    }
  }

  function onSaveTime(event: FormEvent) {
    event.preventDefault();
    if (!draftTime) return;
    setTimeSaved(draftTime);
    setTimeOpen(false);
  }

  const birthParts = [
    birth.date || "дата не указана",
    hasBirthTime || birth.time ? birth.time || "время указано" : "время не указано",
    birth.place || "место не указано",
  ].filter(Boolean);

  return (
    <header className="reveal">
      <h1 className="text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl">
        Добро пожаловать
        {displayName ? (
          <>
            ,{" "}
            <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">
              {displayName}
            </span>
          </>
        ) : null}
      </h1>
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="relative aspect-[16/10] w-full shrink-0 md:aspect-auto md:w-1/3 md:min-h-[13.75rem]">
            <Image
              src="/images/report.webp"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 14rem"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
            <h2 className="text-2xl font-normal leading-[1.15] tracking-tight text-white sm:text-3xl">
              Твой персональный{" "}
              <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">отчёт</span>
            </h2>
          </div>
        </div>
        <div className="report-cta-row flex flex-col gap-2 border-t border-white/10 px-5 py-4 md:flex-row md:px-6">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={downloading}
            className="cabinet-cta"
          >
            {downloading ? "Готовим PDF…" : "Скачать PDF"}
          </button>
          <button
            type="button"
            onClick={() => void onShare()}
            className="cabinet-cta-ghost"
          >
            {copied ? "Ссылка скопирована" : "Поделиться ссылкой"}
          </button>
        </div>
        {shareHint ? <p className="break-all px-5 pb-4 text-base text-[color:var(--muted)] sm:px-6">{shareHint}</p> : null}
        {actionNote ? <p className="px-5 pb-4 text-base text-[color:var(--muted)] sm:px-6">{actionNote}</p> : null}
      </section>

      <hr className="mt-12 border-0 border-t border-white/10" />

      <section className="mt-10">
        <h2 className="text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-[2rem]">
          Твой{" "}
          <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">
            космопортрет
          </span>
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base leading-snug text-white/80">
            {birthParts.map((part, index) => (
              <Fragment key={`${index}-${part}`}>
                {index > 0 ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F6E7A1]" aria-hidden />
                ) : null}
                <span>{part}</span>
              </Fragment>
            ))}
          </p>
          {canEditTime ? (
            <button
              type="button"
              onClick={() => setTimeOpen((open) => !open)}
              className="inline-flex min-h-11 items-center text-base text-[#F6E7A1] underline-offset-4 transition hover:underline"
            >
              {timeOpen ? "Закрыть" : timeSaved ? "Изменить время" : "Указать время"}
            </button>
          ) : null}
        </div>
        {!hasBirthTime ? (
          <p className="report-lede mt-2">
            Асцендент и дома не считаем.
          </p>
        ) : null}
        {canEditTime && timeOpen ? (
          <form
            onSubmit={onSaveTime}
            className="mt-3 flex w-full flex-col gap-3 scroll-mb-32 sm:flex-row sm:items-end"
          >
            <label className="w-full min-w-0 sm:min-w-[10rem] sm:flex-1">
              <span className="sr-only">Время рождения</span>
              <input
                type="time"
                name="birth_time"
                value={draftTime}
                onChange={(event) => setDraftTime(event.target.value)}
                className="min-h-11 w-full border-b border-white/20 bg-transparent text-base text-white outline-none [color-scheme:dark] focus:border-[#F6E7A1]"
              />
            </label>
            <button type="submit" disabled={!draftTime} className="cabinet-cta sm:w-auto sm:px-6">
              Сохранить
            </button>
          </form>
        ) : null}
        {canEditTime && timeSaved ? (
          <p className="report-lede mt-2">
            Время запомнили здесь. Карту пока не пересчитываем, асцендент и дома не считаем.
          </p>
        ) : null}

        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
          {core.map((item) => (
            <li key={item.key} className="min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <p className="text-sm text-white/45">{item.label}</p>
              <CoreValue
                point={item.point}
                missing={item.key === "ascendant" && !hasBirthTime}
              />
            </li>
          ))}
        </ul>

        {wheel?.planets?.length ? (
          <div className="mt-12 overflow-x-clip">
            <NatalWheel wheel={wheel} />
            <p className="mt-4 text-center text-base leading-relaxed text-[color:var(--muted)]">
              <span className="text-[#c45c5c]">Красная</span>: напряжение.{" "}
              <span className="text-[#7eafd6]">Синяя пунктир</span>: поддержка.
            </p>
            <HouseOccupancy points={natal?.points} hasBirthTime={hasBirthTime} />
          </div>
        ) : natal?.points?.length ? (
          <HouseOccupancy points={natal.points} hasBirthTime={hasBirthTime} />
        ) : null}
      </section>
    </header>
  );
}

function HouseOccupancy({
  points,
  hasBirthTime,
}: {
  points?: NatalOccupant[];
  hasBirthTime: boolean;
}) {
  if (!points?.length) return null;
  const byKey = new Map(points.map((point) => [point.key, point]));
  const groupedKeys = new Set(HOUSE_GROUPS.flatMap((group) => group.keys));
  const leftover = points.filter((point) => !groupedKeys.has(point.key) && point.house);
  const groups = HOUSE_GROUPS.map((group) => ({
    title: group.title,
    items: group.keys.map((key) => byKey.get(key)).filter((point): point is NatalOccupant => Boolean(point)),
  })).filter((group) => group.items.length > 0);

  if (groups.length === 0 && leftover.length === 0) return null;

  return (
    <div className="mt-10 space-y-5 text-left">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="report-group-title pb-1">{group.title}</p>
          <ul className="mt-1.5 space-y-1">
            {group.items.map((point) => (
              <li key={point.key} className="text-base leading-snug text-white/80">
                <OccupantLine point={point} hasBirthTime={hasBirthTime} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {leftover.length > 0 ? (
        <div>
          <p className="report-group-title pb-1">Другие точки</p>
          <ul className="mt-1.5 space-y-1">
            {leftover.map((point) => (
              <li key={point.key} className="text-base leading-snug text-white/80">
                <OccupantLine point={point} hasBirthTime={hasBirthTime} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function OccupantLine({ point, hasBirthTime }: { point: NatalOccupant; hasBirthTime: boolean }) {
  const planet = planetGlyph(point.key, point.glyph);
  const sign = signGlyph(point.sign);
  const house =
    hasBirthTime && point.house ? `дом ${point.house}` : point.key === "ascendant" && !hasBirthTime ? "дом не считаем" : "";
  return (
    <>
      {planet ? (
        <span className="natal-astro-glyph mr-1.5 text-[#F6E7A1]" aria-hidden>
          {planet}
        </span>
      ) : null}
      <span>{point.name || point.key}</span>
      {sign ? (
        <span className="natal-astro-glyph mx-1.5 text-[#F6E7A1]" aria-hidden>
          {sign}
        </span>
      ) : null}
      {point.sign_ru ? <span>{point.sign_ru}</span> : null}
      {house ? <span className="text-white/50"> · {house}</span> : null}
    </>
  );
}

function CoreValue({ point, missing }: { point: CorePoint | null; missing: boolean }) {
  if (missing || !point?.sign_ru) {
    return <p className="mt-1 text-base text-white/55">не считаем</p>;
  }
  const glyph = signGlyph(point.sign);
  const dms = formatDms(point.degree, point.minute);
  const meaning = natalMeaning(point.fact);
  return (
    <div className="mt-1">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-white">
        {glyph ? (
          <span className="natal-astro-glyph text-[1.35rem] leading-none text-[#F6E7A1]" aria-hidden>
            {glyph}
          </span>
        ) : null}
        <span className="text-base">{point.sign_ru}</span>
        {dms ? <span className="text-sm text-white/50">{dms}</span> : null}
      </p>
      {meaning ? (
        <p className="mt-2 text-base leading-relaxed text-[color:var(--muted)]">{meaning}</p>
      ) : null}
    </div>
  );
}

function natalMeaning(fact?: string): string {
  if (!fact) return "";
  return fact.split(/\sЭто может проявляться/)[0].trim();
}

function coreLabel(key: CoreKey): string {
  if (key === "sun") return "Солнце";
  if (key === "moon") return "Луна";
  return "Асцендент";
}

function findPoint(report: PaidReport, key: CoreKey): CorePoint | null {
  const points = report.document?.factual?.natal?.points ?? [];
  const fromPoints = points.find((point) => point.key === key);
  if (fromPoints) return fromPoints;
  const fromWheel = report.document?.factual?.natal?.wheel?.planets?.find((planet) => planet.key === key);
  if (!fromWheel) return null;
  return {
    sign: fromWheel.sign,
    sign_ru: fromWheel.sign_ru,
    degree: fromWheel.degree,
    minute: fromWheel.minute,
    house: fromWheel.house,
  };
}

function formatBirthDate(raw?: string): string {
  if (!raw) return "";
  const iso = raw.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatBirthTime(raw?: string): string {
  if (!raw) return "";
  return raw.slice(0, 5);
}

function shareUrlFor(orderId?: string): string {
  const origin = window.location.origin.replace(/\/$/, "");
  if (window.location.pathname.startsWith("/r/")) {
    return `${origin}${window.location.pathname}`;
  }
  if (orderId) return `${origin}/r/${orderId}`;
  return window.location.href;
}
