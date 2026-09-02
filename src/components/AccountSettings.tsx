"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteMyAccount,
  suggestPlaces,
  updateMyBirth,
  type PlaceSuggestion,
} from "@/lib/api";
import { clearAuthNext, clearAuthToken } from "@/lib/auth";
import { clearOnboardingClientState } from "@/lib/onboarding/session";
import {
  formatBirthDateInput,
  formatBirthDateLabel,
  formatBirthTimeLabel,
  isoToDisplayDate,
  toIsoDate,
} from "@/lib/birth-input";

type BirthDraft = {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  birth_lat: number | null;
  birth_lng: number | null;
  timezone: string;
  unknown_time: boolean;
};

export function AccountSettings({ onSaved }: { onSaved?: () => Promise<void> | void }) {
  const { user, logout, refresh } = useAuth();
  const email = user?.email?.trim() || "";
  const birth = user?.birth ?? user?.profile;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BirthDraft>(draftFromUser(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    if (editing) return;
    setDraft(draftFromUser(user));
  }, [editing, user]);

  useEffect(() => {
    const q = draft.birth_place.trim();
    if (!editing || q.length < 2 || draft.birth_lat != null) {
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
  }, [draft.birth_lat, draft.birth_place, editing]);

  const dateLabel = formatBirthDateLabel(birth?.birth_date);
  const timeLabel = birth?.birth_time
    ? formatBirthTimeLabel(birth.birth_time)
    : "не указано";
  const placeLabel = (birth?.birth_place || "").trim() || "не указано";

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const isoDate = toIsoDate(draft.birth_date);
    if (!isoDate) {
      setError("Нужна дата рождения в формате дд.мм.гггг.");
      return;
    }
    if (draft.birth_place.trim().length < 2) {
      setError("Нужен город рождения.");
      return;
    }
    setSaving(true);
    setError("");
    setNote("");
    try {
      const next = await updateMyBirth({
        birth_date: isoDate,
        birth_time: draft.unknown_time ? "" : draft.birth_time,
        birth_place: draft.birth_place.trim(),
        birth_lat: draft.birth_lat,
        birth_lng: draft.birth_lng,
        timezone: draft.timezone,
        unknown_time: draft.unknown_time,
      });
      await refresh();
      await onSaved?.();
      setEditing(false);
      setNote(
        next.has_paid_report
          ? "Сохранили. Карту и разбор пересчитаем по новым данным."
          : "Сохранили данные рождения.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить данные рождения");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteMyAccount();
      clearAuthToken();
      clearAuthNext();
      clearOnboardingClientState();
      window.location.replace("/");
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : "Не удалось удалить аккаунт");
    }
  }

  const fieldClass =
    "mt-3 w-full border-b border-white/20 bg-transparent pb-3 text-xl text-white outline-none placeholder:text-white/50 focus:border-[#F6E7A1] [color-scheme:dark]";

  const loginLine = useMemo(() => {
    if (email) return `Вход выполнен через Яндекс: ${email}`;
    return "Вход выполнен через Яндекс";
  }, [email]);

  return (
    <div className="min-w-0">
      <p className="text-sm leading-relaxed text-white/80">{loginLine}</p>
      <h1 className="mt-3 text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl">
        Аккаунт
      </h1>

      <section className="mt-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-normal text-white sm:text-2xl">Данные рождения</h2>
          <button
            type="button"
            onClick={() => {
              setError("");
              setNote("");
              setEditing((open) => !open);
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-base text-[#F6E7A1] transition hover:text-[#f0dc82]"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.7} aria-hidden />
            {editing ? "Отмена" : "Изменить"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={(event) => void onSave(event)} className="mt-6 flex flex-col gap-8">
            <label className="block">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/80">
                <Calendar className="h-3.5 w-3.5 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
                Дата
              </span>
              <input
                type="text"
                name="birth_date"
                inputMode="numeric"
                autoComplete="bday"
                disabled={saving}
                placeholder="дд.мм.гггг"
                maxLength={10}
                value={draft.birth_date}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, birth_date: formatBirthDateInput(event.target.value) }))
                }
                className={fieldClass}
              />
            </label>

            <label className="relative block">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/80">
                <MapPin className="h-3.5 w-3.5 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
                Место
              </span>
              <input
                type="text"
                name="birth_place"
                autoComplete="off"
                disabled={saving}
                placeholder="Начни вводить город"
                value={draft.birth_place}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    birth_place: event.target.value,
                    birth_lat: null,
                    birth_lng: null,
                    timezone: "",
                  }))
                }
                onFocus={() => {
                  if (suggestions.length > 0) setSuggestOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setSuggestOpen(false), 150);
                }}
                className={fieldClass}
              />
              {suggestLoading ? (
                <p className="mt-2 text-xs font-normal text-white/80">Ищем города…</p>
              ) : null}
              {suggestOpen && suggestions.length > 0 ? (
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
                        onClick={() => {
                          setDraft((prev) => ({
                            ...prev,
                            birth_place: item.place,
                            birth_lat: item.latitude,
                            birth_lng: item.longitude,
                            timezone: item.timezone,
                          }));
                          setSuggestions([]);
                          setSuggestOpen(false);
                        }}
                      >
                        {item.place}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

            <div>
              <label className="block">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/80">
                  <Clock className="h-3.5 w-3.5 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
                  Время
                </span>
                <input
                  type="time"
                  name="birth_time"
                  disabled={saving || draft.unknown_time}
                  value={draft.unknown_time ? "" : draft.birth_time}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      birth_time: event.target.value,
                      unknown_time: false,
                    }))
                  }
                  className={`${fieldClass} ${draft.unknown_time ? "opacity-35" : ""}`}
                />
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={draft.unknown_time}
                  disabled={saving}
                  onChange={(event) =>
                    setDraft((prev) => ({
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

            <button type="submit" disabled={saving} className="cabinet-cta sm:w-auto">
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </form>
        ) : (
          <ul className="mt-6 space-y-4">
            <BirthRow icon={Calendar} label="Дата" value={dateLabel} />
            <BirthRow icon={Clock} label="Время" value={timeLabel} />
            <BirthRow icon={MapPin} label="Место" value={placeLabel} />
          </ul>
        )}
      </section>

      {error ? <p className="report-lede mt-6 text-[#F6E7A1]">{error}</p> : null}
      {note ? <p className="report-lede mt-6">{note}</p> : null}

      <div className="mt-12 space-y-2 border-t border-white/10 pt-6">
        {confirmDelete ? (
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
            <p className="text-base leading-relaxed text-white/80">
              Удалить аккаунт и все данные? Это нельзя отменить.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void onDelete()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#c45c5c]/50 px-5 text-base text-[#f0b4b4] transition hover:bg-[#c45c5c]/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                {deleting ? "Удаляем…" : "Да, удалить"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-base text-white/80 transition hover:text-white"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setError("");
              setConfirmDelete(true);
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-1 text-left text-base text-white/80 transition hover:text-white"
          >
            <Trash2 className="h-5 w-5 shrink-0 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
            Удалить аккаунт
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-1 text-left text-base text-white/80 transition hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
          Выйти
        </button>
      </div>
    </div>
  );
}

function BirthRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#F6E7A1]" strokeWidth={1.7} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-base text-white">{value}</p>
      </div>
    </li>
  );
}

function draftFromUser(user: ReturnType<typeof useAuth>["user"]): BirthDraft {
  const birth = user?.birth ?? user?.profile;
  const time = (birth?.birth_time || "").slice(0, 5);
  return {
    birth_date: isoToDisplayDate(birth?.birth_date),
    birth_time: time,
    birth_place: (birth?.birth_place || "").trim(),
    birth_lat: toNumber(birth?.birth_lat),
    birth_lng: toNumber(birth?.birth_lng),
    timezone: (birth?.timezone || "").trim(),
    unknown_time: !time,
  };
}

function toNumber(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : null;
}
