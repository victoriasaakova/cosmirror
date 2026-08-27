"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { resetOnboardingFlowCache } from "@/components/OnboardingFlow";
import {
  devLoginEmpty,
  devLoginInsight,
  devLoginReport,
  resetLocalDevFlow,
} from "@/lib/dev-reset";
import { freshOnboardingHref, INSIGHT_SLUG, stepHref } from "@/lib/onboarding/paths";

const PREVIEWS = [
  { href: "/account/?preview=auth", label: "Кабинет без входа" },
  { href: "/account/?preview=empty", label: "Кабинет пустой" },
  { href: "/account/?preview=pay", label: "Ждём оплату" },
  { href: "/account/?preview=bank", label: "Банк подтверждает" },
  { href: "/account/?preview=report", label: "Отчёт собирается" },
  { href: "/account/?preview=failed", label: "Оплата не прошла" },
  { href: "/pay/failed/", label: "Страница /pay/failed" },
];

const PAGES = [
  { href: "/", label: "Главная" },
  { href: freshOnboardingHref(), label: "Квиз с первого шага" },
  { href: "/account/", label: "Кабинет как есть" },
  { href: "/blog/", label: "Блог" },
];

export function DevResetPage() {
  const [busy, setBusy] = useState<"reset" | "login" | "flow" | "report" | "insight" | null>(
    null,
  );
  const [note, setNote] = useState("");

  async function onReset() {
    if (busy) return;
    setBusy("reset");
    setNote("");
    try {
      await resetLocalDevFlow();
      window.location.assign("/");
    } catch (err) {
      setBusy(null);
      setNote(err instanceof Error ? err.message : "Не получилось сбросить");
    }
  }

  async function onEmptyLogin() {
    if (busy) return;
    setBusy("login");
    setNote("");
    try {
      await resetLocalDevFlow();
      await devLoginEmpty();
      window.location.assign("/account/");
    } catch (err) {
      setBusy(null);
      setNote(err instanceof Error ? err.message : "Не получилось войти");
    }
  }

  async function onFullFlow() {
    if (busy) return;
    setBusy("flow");
    setNote("");
    try {
      await resetLocalDevFlow();
      await devLoginEmpty();
      window.location.assign(freshOnboardingHref());
    } catch (err) {
      setBusy(null);
      setNote(err instanceof Error ? err.message : "Не получилось начать квиз");
    }
  }

  async function onReportLogin() {
    if (busy) return;
    setBusy("report");
    setNote("");
    try {
      await resetLocalDevFlow();
      await devLoginReport();
      window.location.assign("/account/");
    } catch (err) {
      setBusy(null);
      setNote(err instanceof Error ? err.message : "Не получилось открыть отчёт");
    }
  }

  async function onInsightLogin() {
    if (busy) return;
    setBusy("insight");
    setNote("");
    try {
      await resetLocalDevFlow();
      await devLoginInsight();
      resetOnboardingFlowCache();
      window.location.assign(stepHref(INSIGHT_SLUG));
    } catch (err) {
      setBusy(null);
      setNote(err instanceof Error ? err.message : "Не получилось открыть инсайт");
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#050d4a] text-white">
      <Header />
      <div className="mx-auto max-w-xl px-5 pb-20 pt-28">
        <h1 className="font-display text-3xl tracking-tight">
          Локальный <span className="italic text-[#F6E7A1]">прогон</span>
        </h1>
        <p className="mt-4 font-grotesk text-base leading-relaxed text-white/70">
          Только next dev. Вход без Яндекса, чтобы пройти квиз, оплату и кабинет на localhost.
          После оплаты смотри эту же вкладку: Prodamus не возвращает на http://localhost.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void onReportLogin()}
            disabled={Boolean(busy)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F6E7A1] px-4 font-grotesk text-base font-medium text-[#0a1a3a] transition hover:bg-[#f0dc82] disabled:opacity-50"
          >
            {busy === "report" ? "Собираем отчёт…" : "Открыть мой отчёт"}
          </button>
          <p className="mb-2 px-1 font-grotesk text-sm leading-relaxed text-white/45">
            Готовый кабинет по твоей карте: 26 мая 1995, 19:25, Гдыня. Без квиза и оплаты.
          </p>
          <button
            type="button"
            onClick={() => void onInsightLogin()}
            disabled={Boolean(busy)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#F6E7A1]/40 px-4 font-grotesk text-base font-medium text-[#F6E7A1] transition hover:bg-[#F6E7A1]/10 disabled:opacity-50"
          >
            {busy === "insight" ? "Собираем инсайт…" : "Инсайт, оплата и кабинет"}
          </button>
          <p className="mb-2 px-1 font-grotesk text-sm leading-relaxed text-white/45">
            Квиз уже заполнен. Дальше космопортрет, оферта, контакты, оплата и экран после оплаты.
          </p>
          <button
            type="button"
            onClick={() => void onFullFlow()}
            disabled={Boolean(busy)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#F6E7A1]/40 px-4 font-grotesk text-base font-medium text-[#F6E7A1] transition hover:bg-[#F6E7A1]/10 disabled:opacity-50"
          >
            {busy === "flow" ? "Открываем…" : "Пройти путь с нуля"}
          </button>
          <button
            type="button"
            onClick={() => void onEmptyLogin()}
            disabled={Boolean(busy)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#F6E7A1]/40 px-4 font-grotesk text-base font-medium text-[#F6E7A1] transition hover:bg-[#F6E7A1]/10 disabled:opacity-50"
          >
            {busy === "login" ? "Входим…" : "Войти в пустой кабинет"}
          </button>
          <button
            type="button"
            onClick={() => void onReset()}
            disabled={Boolean(busy)}
            className="inline-flex h-11 w-full items-center justify-center rounded-full px-4 font-grotesk text-base font-medium text-white/55 transition hover:text-[#F6E7A1] disabled:opacity-50"
          >
            {busy === "reset" ? "Сбрасываем…" : "Выйти и стереть демо-заказы"}
          </button>
        </div>
        {note ? <p className="mt-3 text-sm text-white/55">{note}</p> : null}

        <h2 className="mt-12 font-grotesk text-base text-white/55">Экраны кабинета</h2>
        <ul className="mt-4 space-y-3">
          {PREVIEWS.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="font-grotesk text-base text-white/80 transition hover:text-[#F6E7A1]">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-grotesk text-base text-white/55">Страницы</h2>
        <ul className="mt-4 space-y-3">
          {PAGES.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="font-grotesk text-base text-white/80 transition hover:text-[#F6E7A1]">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
