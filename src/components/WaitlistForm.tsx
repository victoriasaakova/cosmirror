"use client";

import { FormEvent, useState } from "react";
import { joinWaitlist } from "@/lib/api";

const SHIFTS = ["Карьера", "Отношения", "Место", "Кто я", "Всё сразу"] as const;

type WaitlistFormProps = {
  variant?: "hero" | "section";
};

export function WaitlistForm({ variant = "section" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [shift, setShift] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await joinWaitlist({
        email,
        message: shift ? `Что сдвигается: ${shift}` : "",
        source: "landing-portrait",
      });
      setStatus("ok");
      setMessage("Готово. Мы пришлём первый персональный портрет на этот email.");
      setEmail("");
      setShift("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Ошибка отправки");
    }
  }

  if (variant === "hero") {
    return (
      <form onSubmit={onSubmit} className="relative flex w-full max-w-md flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full flex-1 rounded-full border border-white/15 bg-black/30 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--copper)]/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary shrink-0 px-6 py-3.5 text-sm disabled:opacity-60"
          >
            {status === "loading" ? "Отправляем…" : "Получить портрет →"}
          </button>
        </div>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-white/70"}`}>{message}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <div className="glass overflow-hidden rounded-[2rem] p-6 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-white/20 bg-transparent pb-3 text-lg text-white outline-none placeholder:text-white/30 focus:border-[var(--copper)]"
              />
            </div>

            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                Что сдвигается прямо сейчас? (необязательно)
              </p>
              <div className="flex flex-wrap gap-2">
                {SHIFTS.map((item) => {
                  const active = shift === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setShift(active ? "" : item)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-[var(--copper)]/60 bg-[var(--copper)]/15 text-[var(--peach)]"
                          : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="group relative mx-auto flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#f2c4a8] via-[#e89a8c] to-[#c97a58] text-[#1a1210] shadow-[0_16px_50px_rgba(232,160,122,0.35)] transition hover:scale-[1.03] disabled:opacity-60 lg:mx-0"
            aria-label="Получить портрет"
          >
            <span className="mb-1 text-2xl transition group-hover:translate-x-0.5">→</span>
            <span className="max-w-[5.5rem] text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.12em]">
              {status === "loading" ? "Отправляем" : "Получить портрет"}
            </span>
          </button>
        </div>

        {message ? (
          <p className={`mt-6 text-sm ${status === "error" ? "text-red-300" : "text-white/70"}`}>{message}</p>
        ) : null}
      </div>
    </form>
  );
}
