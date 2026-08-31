"use client";

import { FormEvent, useEffect, useState } from "react";
import { NatalWheel } from "@/components/NatalWheel";
import {
  calculateLandingChart,
  fetchLandingChart,
  suggestPlaces,
  type LandingChartWheel,
  type PlaceSuggestion,
} from "@/lib/api";
import { formatBirthDateInput, isoToDisplayDate, toIsoDate } from "@/lib/birth-input";
import { EMPTY_NATAL_WHEEL } from "@/lib/landing-demo";
import { continueOnboardingHref } from "@/lib/onboarding/paths";
import {
  readLandingChartToken,
  writeLandingChartToken,
} from "@/lib/onboarding/session";

type FormState = {
  birth_date: string;
  birth_place: string;
  birth_time: string;
  unknown_time: boolean;
  birth_lat: number | null;
  birth_lng: number | null;
  timezone: string;
};

const EMPTY_FORM: FormState = {
  birth_date: "",
  birth_place: "",
  birth_time: "",
  unknown_time: false,
  birth_lat: null,
  birth_lng: null,
  timezone: "",
};

function fieldClass() {
  return "mt-3 w-full border-b border-white/20 bg-transparent pb-3 text-lg text-white outline-none placeholder:text-white/30 focus:border-[#F6E7A1] sm:text-xl [color-scheme:dark]";
}

export function LandingChartBlock() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [wheel, setWheel] = useState<LandingChartWheel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const token = readLandingChartToken();
    if (!token) return;
    let cancelled = false;
    void fetchLandingChart(token)
      .then((data) => {
        if (cancelled) return;
        writeLandingChartToken(data.token);
        setWheel(data.wheel);
        const birth = data.birth;
        if (birth?.birth_date) {
          setForm({
            birth_date: isoToDisplayDate(birth.birth_date),
            birth_place: birth.birth_place || "",
            birth_time: birth.birth_time || "",
            unknown_time: !birth.birth_time,
            birth_lat: birth.birth_lat ?? null,
            birth_lng: birth.birth_lng ?? null,
            timezone: birth.timezone || "",
          });
        }
      })
      .catch(() => {
        /* нет сохранённой карты — оставляем пустое колесо */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = form.birth_place.trim();
    if (q.length < 2 || form.birth_lat != null) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const results = await suggestPlaces(q);
        if (!cancelled) {
          setSuggestions(results);
          setSuggestOpen(results.length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestOpen(false);
        }
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.birth_place, form.birth_lat]);

  const dateInvalid = Boolean(error && !toIsoDate(form.birth_date));
  const placeInvalid = Boolean(error && form.birth_place.trim().length < 2);
  const shownWheel = wheel ?? EMPTY_NATAL_WHEEL;
  const hasChart = Boolean(wheel?.planets?.length);
  const locked = hasChart || submitting;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hasChart) return;
    const isoDate = toIsoDate(form.birth_date);
    if (!isoDate) {
      setError("Нужна дата рождения.");
      return;
    }
    if (form.birth_place.trim().length < 2) {
      setError("Нужен город рождения.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await calculateLandingChart({
        token: readLandingChartToken() || undefined,
        birth_date: isoDate,
        birth_time: form.unknown_time ? undefined : form.birth_time || undefined,
        unknown_time: form.unknown_time,
        birth_place: form.birth_place.trim(),
        birth_lat: form.birth_lat,
        birth_lng: form.birth_lng,
        timezone: form.timezone,
      });
      writeLandingChartToken(data.token);
      setWheel(data.wheel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось посчитать карту");
    } finally {
      setSubmitting(false);
    }
  }

  function pickPlace(item: PlaceSuggestion) {
    if (hasChart) return;
    setForm((prev) => ({
      ...prev,
      birth_place: item.place,
      birth_lat: item.latitude,
      birth_lng: item.longitude,
      timezone: item.timezone,
    }));
    setSuggestions([]);
    setSuggestOpen(false);
  }

  return (
    <section id="chart" className="relative scroll-mt-28 overflow-hidden bg-[#050d4a] pb-16 pt-10 md:pb-24 md:pt-12">
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Посчитай свою <span className="font-display italic text-[#F6E7A1]">карту</span>
          </h2>
        </div>

        <div className="mt-5 grid items-center gap-4 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="order-1 flex items-center justify-center lg:order-2 lg:min-h-[24rem]">
            <NatalWheel wheel={shownWheel} />
          </div>

          <form onSubmit={onSubmit} className="order-2 flex flex-col lg:order-1">
            <div>
              <label htmlFor="landing-birth-date" className="text-xs uppercase tracking-[0.16em] text-white/40">
                Дата рождения
              </label>
              <input
                id="landing-birth-date"
                type="text"
                name="birth_date"
                inputMode="numeric"
                autoComplete="bday"
                disabled={locked}
                placeholder="дд.мм.гггг"
                maxLength={10}
                value={form.birth_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    birth_date: formatBirthDateInput(event.target.value),
                  }))
                }
                aria-invalid={dateInvalid}
                className={`${fieldClass()} ${dateInvalid ? "!border-[#F6E7A1]" : ""} ${locked ? "opacity-60" : ""}`}
              />
            </div>

            <div className="relative mt-8">
              <label htmlFor="landing-birth-place" className="text-xs uppercase tracking-[0.16em] text-white/40">
                Город рождения
              </label>
              <input
                id="landing-birth-place"
                type="text"
                name="birth_place"
                autoComplete="off"
                disabled={locked}
                placeholder="Начни вводить город"
                value={form.birth_place}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    birth_place: event.target.value,
                    birth_lat: null,
                    birth_lng: null,
                    timezone: "",
                  }))
                }
                onFocus={() => {
                  if (!hasChart && suggestions.length > 0) setSuggestOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setSuggestOpen(false), 150);
                }}
                aria-invalid={placeInvalid}
                aria-autocomplete="list"
                aria-expanded={suggestOpen}
                className={`${fieldClass()} ${placeInvalid ? "!border-[#F6E7A1]" : ""} ${locked ? "opacity-60" : ""}`}
              />
              {suggestLoading && !hasChart ? (
                <p className="mt-2 text-xs font-normal text-white/50">Ищем города…</p>
              ) : null}
              {suggestOpen && suggestions.length > 0 && !hasChart ? (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-white/15 bg-[#12121a]/95 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
                >
                  {suggestions.map((item) => (
                    <li key={`${item.place}-${item.latitude}-${item.longitude}`}>
                      <button
                        type="button"
                        role="option"
                        className="w-full px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickPlace(item)}
                      >
                        {item.place}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-8">
              <label htmlFor="landing-birth-time" className="text-xs uppercase tracking-[0.16em] text-white/40">
                Время рождения
              </label>
              <input
                id="landing-birth-time"
                type="time"
                name="birth_time"
                disabled={locked || form.unknown_time}
                value={form.unknown_time ? "" : form.birth_time}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    birth_time: event.target.value,
                    unknown_time: false,
                  }))
                }
                className={`${fieldClass()} ${form.unknown_time || locked ? "opacity-60" : ""}`}
              />
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/65">
                <input
                  type="checkbox"
                  checked={form.unknown_time}
                  disabled={locked}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      unknown_time: event.target.checked,
                      birth_time: event.target.checked ? "" : prev.birth_time,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#F6E7A1]"
                />
                <span>Не знаю точное время рождения</span>
              </label>
            </div>

            {error ? <p className="mt-6 text-sm text-[#F6E7A1]">{error}</p> : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {hasChart ? (
                <a
                  href={continueOnboardingHref()}
                  className="inline-flex items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] shadow-[0_10px_28px_rgba(246,231,161,0.28)] transition-all hover:scale-[1.03] hover:bg-[#f0dc82] active:scale-[0.98]"
                >
                  Узнать больше
                </a>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] shadow-[0_10px_28px_rgba(246,231,161,0.28)] transition-all hover:scale-[1.03] hover:bg-[#f0dc82] active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Считаем…" : "Показать карту"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
