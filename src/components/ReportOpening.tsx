"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { NatalWheel } from "@/components/NatalWheel";
import { SignsTable } from "@/components/SignsTable";
import { formatDms, signGlyph } from "@/lib/astro-glyphs";
import { createChartShare, type PaidReport } from "@/lib/api";

const CORE = ["sun", "moon", "ascendant"] as const;

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
  hideShareActions?: boolean;
  shareMode?: boolean;
  mobileView?: "overview" | "chart";
};

export function ReportOpening({
  report,
  displayName,
  downloading,
  onDownloadPdf,
  actionNote,
  hideShareActions = false,
  shareMode = false,
  mobileView = "overview",
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
  const [shareBusy, setShareBusy] = useState(false);

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
    if (shareBusy) return;
    setShareBusy(true);
    setShareHint("");
    try {
      const { url } = await createChartShare();
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setShareHint(url);
      }
    } catch (err) {
      setShareHint(err instanceof Error ? err.message : "Не получилось создать ссылку");
    } finally {
      setShareBusy(false);
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

  const paid = !hideShareActions && !shareMode;
  const reportCard =
    paid && mobileView === "overview" ? (
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] sm:mt-10">
        <div className="flex flex-col items-stretch sm:flex-row">
          <div className="relative aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:w-[11rem] lg:w-[13.5rem]">
            <Image
              src="/images/report.webp"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 11rem, 13.5rem"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 sm:gap-4 sm:p-5">
            <h2 className="text-xl font-normal leading-[1.15] tracking-tight text-white sm:text-2xl">
              Твой персональный{" "}
              <span className="font-display inline-block pb-0.5 italic leading-[1.15] text-[#F6E7A1]">
                отчёт
              </span>
            </h2>
            <div className="report-cta-row grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={downloading}
                className="cabinet-cta"
              >
                {downloading ? "Готовим…" : "Скачать PDF"}
              </button>
              <button
                type="button"
                onClick={() => void onShare()}
                disabled={shareBusy}
                className="cabinet-cta-ghost"
              >
                {copied ? "Скопировано" : shareBusy ? "Создаём…" : "Поделиться"}
              </button>
            </div>
            {shareHint ? (
              <p className="break-all text-sm text-[color:var(--muted)]">{shareHint}</p>
            ) : null}
            {actionNote ? (
              <p className="text-sm text-[color:var(--muted)]">{actionNote}</p>
            ) : null}
          </div>
        </div>
      </section>
    ) : null;

  return (
    <header className="reveal">
      {mobileView === "overview" ? (
        <>
          <h1 className="text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl">
            {shareMode ? (
              <>
                Натальная{" "}
                <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">
                  карта
                </span>
              </>
            ) : (
              <>
                Добро пожаловать
                {displayName ? (
                  <>
                    ,{" "}
                    <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">
                      {displayName}
                    </span>
                  </>
                ) : null}
              </>
            )}
          </h1>

          {shareMode ? (
            !hasBirthTime ? (
              <p className="report-lede mt-5">Асцендент и дома не считаем.</p>
            ) : null
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base leading-snug text-white/80">
                  {birthParts.map((part, index) => (
                    <Fragment key={`${index}-${part}`}>
                      {index > 0 ? (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F6E7A1]"
                          aria-hidden
                        />
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
                <p className="report-lede mt-2">Асцендент и дома не считаем.</p>
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
                  <button
                    type="submit"
                    disabled={!draftTime}
                    className="cabinet-cta sm:w-auto"
                  >
                    Сохранить
                  </button>
                </form>
              ) : null}
              {canEditTime && timeSaved ? (
                <p className="report-lede mt-2">
                  Время запомнили здесь. Карту пока не пересчитываем, асцендент и дома не считаем.
                </p>
              ) : null}
            </>
          )}

          {reportCard}
        </>
      ) : null}

      <div className={mobileView === "overview" && !shareMode ? "hidden lg:block" : undefined}>
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
          {core.map((item) => (
            <li key={item.key} className="min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <p className="text-sm text-white/80">{item.label}</p>
              <CoreValue point={item.point} missing={item.key === "ascendant" && !hasBirthTime} />
            </li>
          ))}
        </ul>

        {wheel?.planets?.length ? (
          <div className="mt-8 sm:mt-10">
            <div className="-mx-4 overflow-x-clip sm:mx-0">
              <NatalWheel wheel={wheel} />
            </div>
            <ul className="mt-3 flex flex-col items-center gap-1.5 text-[0.75rem] leading-snug text-white/80 sm:mt-4 sm:flex-row sm:justify-center sm:gap-6">
              <li className="inline-flex items-center gap-2">
                <AspectSwatch kind="hard" />
                напряжение: квадрат и оппозиция
              </li>
              <li className="inline-flex items-center gap-2">
                <AspectSwatch kind="soft" />
                поддержка: тригон и секстиль
              </li>
            </ul>
          </div>
        ) : null}

        <SignsTable points={natal?.points} hasBirthTime={hasBirthTime} />
      </div>
    </header>
  );
}

function AspectSwatch({ kind }: { kind: "hard" | "soft" }) {
  const hard = kind === "hard";
  return (
    <svg
      width="28"
      height="10"
      viewBox="0 0 28 10"
      aria-hidden
      className="shrink-0"
    >
      <line
        x1="1"
        y1="5"
        x2="27"
        y2="5"
        stroke={hard ? "#c45c5c" : "#7eafd6"}
        strokeOpacity={hard ? 0.78 : 0.7}
        strokeWidth={hard ? 1.6 : 1.35}
        strokeLinecap="round"
        strokeDasharray={hard ? undefined : "4.5 3.5"}
      />
    </svg>
  );
}

function CoreValue({ point, missing }: { point: CorePoint | null; missing: boolean }) {
  if (missing || !point?.sign_ru) {
    return <p className="mt-1 text-base text-white/80">не считаем</p>;
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
