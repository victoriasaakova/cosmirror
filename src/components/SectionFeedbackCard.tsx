"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  submitSectionFeedback,
  type ReportFeedbackRating,
  type ReportFeedbackSection,
  type SectionFeedback,
} from "@/lib/api";

const RATINGS: { id: ReportFeedbackRating; emoji: string; label: string }[] = [
  { id: "about_me", emoji: "🌝", label: "про меня" },
  { id: "partial", emoji: "🌗", label: "частично" },
  { id: "not_about_me", emoji: "🌚", label: "не про меня" },
];

const FIELD_CLASS =
  "mt-3 w-full border-b border-white/20 bg-transparent pb-3 text-lg text-white caret-[#F6E7A1] outline-none placeholder:text-white/50 focus:border-[#F6E7A1] [color-scheme:dark]";

function isComplete(row?: SectionFeedback | null): boolean {
  if (!row?.rating) return false;
  return row.comment_skipped || Boolean(row.comment.trim());
}

function DualHeading({
  before,
  accent,
  after,
}: {
  before: string;
  accent: string;
  after?: string;
}) {
  return (
    <h3 className="text-base font-normal leading-snug tracking-tight text-white sm:text-lg">
      {before}{" "}
      <span className="font-display italic text-[#F6E7A1]">{accent}</span>
      {after ? <span> {after}</span> : null}
    </h3>
  );
}

export function SectionFeedbackCard({
  section,
  initial,
  onSaved,
}: {
  section: ReportFeedbackSection;
  initial?: SectionFeedback | null;
  onSaved?: (row: SectionFeedback) => void;
}) {
  const [row, setRow] = useState<SectionFeedback | null>(initial ?? null);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Reset only when the report tab changes. `initial` identity also changes
    // after a save and must not wipe an in-progress comment.
    setRow(initial ?? null);
    setComment(initial?.comment ?? "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- section is the reset key
  }, [section]);

  useEffect(() => {
    if (!initial) return;
    setRow((prev) => prev ?? initial);
    setComment((prev) => prev || initial.comment || "");
  }, [initial]);

  const rating = row?.rating ?? null;
  const done = isComplete(row);

  async function save(next: {
    rating: ReportFeedbackRating;
    comment?: string;
    comment_skipped?: boolean;
  }) {
    setSaving(true);
    setError("");
    try {
      const saved = await submitSectionFeedback({
        section,
        rating: next.rating,
        comment: next.comment,
        comment_skipped: next.comment_skipped,
      });
      setRow(saved);
      onSaved?.(saved);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось сохранить. Попробуй ещё раз.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onPick(nextRating: ReportFeedbackRating) {
    if (saving || nextRating === rating) return;
    const previous = row;
    setRow((prev) => ({
      section,
      rating: nextRating,
      comment: prev?.comment ?? "",
      comment_skipped: false,
      updated_at: prev?.updated_at ?? "",
    }));
    const saved = await save({ rating: nextRating });
    if (!saved) setRow(previous);
  }

  async function onSubmitComment(event: FormEvent) {
    event.preventDefault();
    if (!rating) return;
    const text = comment.trim();
    await save({
      rating,
      comment: text,
      comment_skipped: !text,
    });
  }

  if (done) {
    return (
      <section
        className="mt-8 w-full rounded-2xl border border-[#F6E7A1]/18 bg-white/[0.04] px-4 py-4"
        aria-live="polite"
      >
        <DualHeading before="Уже смотрим твой" accent="фидбэк" after="👀" />
        <p className="mt-2 text-sm font-normal leading-relaxed text-[#fff]">
          Спасибо, что помогаешь нам{" "}
          <span className="font-display italic text-[#F6E7A1]">стать лучше!</span>
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 w-full rounded-2xl border border-[#F6E7A1]/18 bg-white/[0.04] px-4 py-4">
      <DualHeading before="Насколько это" accent="про тебя?" />
      <p className="mt-2 text-sm font-normal leading-relaxed text-[#fff]">
        Насколько точно этот раздел описывает твой опыт.
      </p>
      <div role="group" aria-label="Насколько это про тебя" className="mt-3 flex flex-wrap gap-1">
        {RATINGS.map((item) => {
          const active = rating === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={saving}
              aria-pressed={active}
              onClick={() => void onPick(item.id)}
              className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2 py-1 text-[12px] leading-none transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1] enabled:active:scale-[0.96] disabled:opacity-50 sm:text-[13px] sm:px-2.5 ${
                active
                  ? "border-[#F6E7A1] bg-[#F6E7A1] text-[#0a1a3a] hover:bg-[#f0dc82]"
                  : "border-white/18 bg-transparent text-white hover:border-[#F6E7A1] hover:bg-white/[0.06] hover:text-[#F6E7A1]"
              }`}
            >
              <span aria-hidden>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {rating ? (
        <form onSubmit={(event) => void onSubmitComment(event)} className="mt-1">
          <label htmlFor={`feedback-comment-${section}`} className="sr-only">
            Комментарий к разделу
          </label>
          <input
            id={`feedback-comment-${section}`}
            type="text"
            name="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            disabled={saving}
            placeholder="что совпало или не совпало"
            autoComplete="off"
            className={FIELD_CLASS}
          />
          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex min-h-9 items-center justify-center rounded-full bg-[#F6E7A1] px-5 py-2 text-sm font-medium leading-none text-[#0a1a3a] transition duration-200 ease-out hover:bg-[#f0dc82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1] enabled:active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? "Отправляем…" : "Отправить"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 text-sm text-[#f0b4b4]">{error}</p> : null}
    </section>
  );
}
