"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  submitSectionFeedback,
  type ReportFeedbackRating,
  type ReportFeedbackSection,
  type SectionFeedback,
} from "@/lib/api";

const RATINGS: { id: ReportFeedbackRating; label: string }[] = [
  { id: "about_me", label: "Про меня" },
  { id: "partial", label: "Частично" },
  { id: "not_about_me", label: "Не про меня" },
];

type Step = "rate" | "comment" | "done";

function stepFrom(row?: SectionFeedback | null): Step {
  if (!row?.rating) return "rate";
  if (row.comment_skipped || row.comment.trim()) return "done";
  return "comment";
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
  const [step, setStep] = useState<Step>(() => stepFrom(initial));
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initial) return;
    setRow((prev) => prev ?? initial);
    setStep((prev) => (prev === "rate" ? stepFrom(initial) : prev));
    setComment((prev) => prev || initial.comment || "");
  }, [initial]);

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

  async function onPick(rating: ReportFeedbackRating) {
    const saved = await save({ rating });
    if (saved) setStep("comment");
  }

  async function onSubmitComment(event: FormEvent) {
    event.preventDefault();
    if (!row?.rating) return;
    const saved = await save({ rating: row.rating, comment: comment.trim() });
    if (saved) setStep("done");
  }

  async function onSkip() {
    if (!row?.rating) return;
    const saved = await save({ rating: row.rating, comment_skipped: true });
    if (saved) setStep("done");
  }

  return (
    <section className="mt-12 rounded-2xl border border-[#F6E7A1]/20 bg-white/[0.04] p-5">
      {step === "rate" ? (
        <>
          <h3 className="report-theme-title pb-1">Насколько это про тебя?</h3>
          <p className="mt-3 report-lede">
            Помоги нам понять, насколько точно этот раздел описывает твой опыт.
          </p>
          <div
            role="group"
            aria-label="Насколько это про тебя"
            className="mt-5 grid grid-cols-3 gap-2"
          >
            {RATINGS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={saving}
                onClick={() => void onPick(item.id)}
                className="report-chip min-h-11 w-full whitespace-normal px-2 text-center text-sm sm:px-3 sm:text-base"
                data-active="false"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {step === "comment" ? (
        <form onSubmit={(event) => void onSubmitComment(event)}>
          <h3 className="report-theme-title pb-1">Спасибо!</h3>
          <label className="mt-3 block">
            <span className="report-lede">
              Если хочешь, добавь пару слов о том, что совпало или не совпало.
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={2000}
              disabled={saving}
              className="mt-3 min-h-[5.5rem] w-full resize-y border-b border-white/20 bg-transparent py-2 text-base text-white outline-none placeholder:text-white/35 focus:border-[#F6E7A1]"
            />
          </label>
          <div className="report-cta-row mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={saving} className="cabinet-cta">
              {saving ? "Сохраняем…" : "Отправить"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSkip()}
              className="cabinet-cta-ghost"
            >
              В другой раз
            </button>
          </div>
        </form>
      ) : null}

      {step === "done" ? <p className="report-theme-title pb-1">Спасибо!</p> : null}

      {error ? <p className="mt-4 text-base text-[#f0b4b4]">{error}</p> : null}
    </section>
  );
}
