"use client";

import { useEffect, useState } from "react";
import { suggestPlaces, type PlaceSuggestion } from "@/lib/api";
import { formatBirthDateInput } from "@/lib/birth-input";
import type { PersonDraft } from "@/lib/compatibility/types";
import { fieldClass, labelClass, personCardClass } from "@/components/compatibility/styles";

const CARD_TITLE = { A: "Твоя карта", B: "Карта партнёра" } as const;
const NAME_PLACEHOLDER = { A: "Ты", B: "Партнёр" } as const;

type Props = {
  person: PersonDraft;
  disabled?: boolean;
  onChange: (next: PersonDraft) => void;
};

export function PersonCard({ person, disabled = false, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const title = CARD_TITLE[person.id];
  const namePlaceholder = NAME_PLACEHOLDER[person.id];
  const dateId = `${person.id}-birth-date`;
  const placeId = `${person.id}-birth-place`;
  const timeId = `${person.id}-birth-time`;
  const nameId = `${person.id}-name`;

  useEffect(() => {
    const query = person.placeName.trim();
    if (query.length < 2 || person.latitude != null) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const results = await suggestPlaces(query);
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
  }, [person.latitude, person.placeName]);

  function pickPlace(item: PlaceSuggestion) {
    onChange({
      ...person,
      placeName: item.place,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    });
    setSuggestions([]);
    setSuggestOpen(false);
  }

  return (
    <article className={personCardClass}>
      <h2 className="font-grotesk text-2xl font-normal leading-tight tracking-tight text-white">{title}</h2>

      <div className="mt-8">
        <label htmlFor={nameId} className={labelClass}>
          Имя
        </label>
        <input
          id={nameId}
          type="text"
          name={`${person.id}-name`}
          autoComplete="name"
          disabled={disabled}
          placeholder={namePlaceholder}
          value={person.displayName}
          onChange={(event) => onChange({ ...person, displayName: event.target.value })}
          className={`${fieldClass} ${disabled ? "opacity-60" : ""}`}
        />
      </div>

      <div className="mt-8">
        <label htmlFor={dateId} className={labelClass}>
          Дата рождения
        </label>
        <input
          id={dateId}
          type="text"
          name={`${person.id}-birth-date`}
          inputMode="numeric"
          autoComplete="bday"
          disabled={disabled}
          placeholder="дд.мм.гггг"
          maxLength={10}
          value={person.birthDate}
          onChange={(event) =>
            onChange({ ...person, birthDate: formatBirthDateInput(event.target.value) })
          }
          className={`${fieldClass} ${disabled ? "opacity-60" : ""}`}
        />
      </div>

      <div className="relative mt-8">
        <label htmlFor={placeId} className={labelClass}>
          Город рождения
        </label>
        <input
          id={placeId}
          type="text"
          name={`${person.id}-birth-place`}
          autoComplete="off"
          disabled={disabled}
          placeholder="Начни вводить город"
          value={person.placeName}
          onChange={(event) =>
            onChange({
              ...person,
              placeName: event.target.value,
              latitude: null,
              longitude: null,
              timezone: "",
            })
          }
          onFocus={() => {
            if (suggestions.length > 0) setSuggestOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setSuggestOpen(false), 150);
          }}
          aria-autocomplete="list"
          aria-expanded={suggestOpen}
          className={`${fieldClass} ${disabled ? "opacity-60" : ""}`}
        />
        {suggestLoading && !disabled ? (
          <p className="mt-2 text-sm font-normal text-white/70">Ищем города…</p>
        ) : null}
        {suggestOpen && suggestions.length > 0 && !disabled ? (
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
        <label htmlFor={timeId} className={labelClass}>
          Время рождения
        </label>
        <input
          id={timeId}
          type="time"
          name={`${person.id}-birth-time`}
          disabled={disabled || person.unknownTime}
          value={person.unknownTime ? "" : person.birthTime}
          onChange={(event) =>
            onChange({ ...person, birthTime: event.target.value, unknownTime: false })
          }
          className={`${fieldClass} ${person.unknownTime || disabled ? "opacity-60" : ""}`}
        />
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={person.unknownTime}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...person,
                unknownTime: event.target.checked,
                birthTime: event.target.checked ? "" : person.birthTime,
              })
            }
            className="mt-0.5 h-4 w-4 accent-[#F6E7A1]"
          />
          <span>Не знаю точное время рождения</span>
        </label>
      </div>
    </article>
  );
}
