"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { CabinetQuiz, OnboardingInsight, OnboardingStep } from "@/lib/api";
import { createOrder, submitOnboardingStep } from "@/lib/api";
import { captureEvent } from "@/lib/posthog-client";
import { goToPayment, openPayWindow } from "@/lib/onboarding/checkout";
import {
  CONTACTS_SUPPORT,
  contactsAreValid,
  isValidEmail,
  isValidTelegram,
  type ContactsAnswers,
} from "@/lib/onboarding/contacts";
import {
  ensureSessionToken,
  getOrderIdempotencyKey,
  rotateOrderIdempotencyKey,
  writeLastOrderId,
} from "@/lib/onboarding/session";
import { InsightFunnel, INSIGHT_OFFER_INDEX } from "@/components/InsightFunnel";
import { ONBOARDING_PURCHASE_FLOW } from "@/lib/flags/onboarding-purchase-flow";

const PAYWALL_INSIGHT = {
  status: "ready",
  has_birth_time: false,
  natal: {
    planets: {},
    ascendant: null,
    midheaven: null,
    houses: null,
    notes: [],
    location: { place: "", lat: 0, lng: 0 },
    timezone: "",
    engine: "",
  },
  insight: {
    tone: "",
    disclaimer: "",
    base: [],
    cycles: [],
    influences: [],
    sky_now: {},
    offer: { title: "", text: "", cta: "Получить за 777 ₽" },
  },
} as OnboardingInsight;

type PaywallScreen = 1 | 2 | 3;

export function ReportPaywall({
  open,
  onClose,
  quiz,
  contacts,
  waitlistSlug,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  quiz?: CabinetQuiz | null;
  contacts?: { email?: string; telegram?: string } | null;
  waitlistSlug?: string;
  steps: OnboardingStep[];
}) {
  const [screen, setScreen] = useState<PaywallScreen>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ContactsAnswers>({
    email: contacts?.email || "",
    telegram: contacts?.telegram || "",
    pd_consent: true,
    offer_consent: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setScreen(1);
    setError("");
    setForm((prev) => ({
      ...prev,
      email: contacts?.email || prev.email,
      telegram: contacts?.telegram || prev.telegram,
    }));
  }, [open, contacts?.email, contacts?.telegram]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const extraPayload = {
    focus: quiz?.focus ?? [],
    intent: quiz?.intent ?? "",
    life_stage: quiz?.life_stage ?? "",
  };
  const confirmReady = contactsAreValid(form) && form.pd_consent && form.offer_consent;

  async function startCheckout() {
    if (submitting) return;
    if (!contactsAreValid(form)) {
      setError(CONTACTS_SUPPORT);
      return;
    }
    if (!form.offer_consent) {
      setError("Нужно принять публичную оферту");
      return;
    }
    const payWindow = openPayWindow();
    setSubmitting(true);
    setError("");
    try {
      const token = await ensureSessionToken();
      if (waitlistSlug && steps.length) {
        await submitOnboardingStep(
          token,
          waitlistSlug,
          {
            email: form.email.trim(),
            telegram: form.telegram.trim(),
            pd_consent: true,
            offer_consent: true,
            offer_consent_at: new Date().toISOString(),
          },
          true,
        );
      }
      let key = getOrderIdempotencyKey(token);
      let order = await createOrder(token, key);
      writeLastOrderId(order.id);
      if (order.status === "paid") {
        captureEvent("checkout_started", {
          order_id: order.id,
          order_status: order.status,
          onboarding_purchase_flow: ONBOARDING_PURCHASE_FLOW.CABINET,
        });
        if (payWindow && !payWindow.closed) payWindow.close();
        window.location.assign("/account/");
        return;
      }
      if (order.status === "canceled" || order.status === "denied") {
        key = rotateOrderIdempotencyKey(token);
        order = await createOrder(token, key);
        writeLastOrderId(order.id);
      }
      captureEvent("checkout_started", {
        order_id: order.id,
        order_status: order.status,
        onboarding_purchase_flow: ONBOARDING_PURCHASE_FLOW.CABINET,
      });
      if (order.payment_url) {
        goToPayment(order.payment_url, payWindow);
        return;
      }
      if (payWindow && !payWindow.closed) payWindow.close();
      setError("Не удалось получить ссылку на оплату. Попробуй ещё раз.");
    } catch (err) {
      if (payWindow && !payWindow.closed) payWindow.close();
      setError(err instanceof Error ? err.message : "Не удалось создать заказ");
    } finally {
      setSubmitting(false);
    }
  }

  function onAdvance() {
    if (screen === 3) {
      if (!confirmReady || submitting) return;
      void startCheckout();
      return;
    }
    setError("");
    setScreen((current) => (current + 1) as PaywallScreen);
  }

  const cta =
    screen === 1
      ? "Продолжить"
      : screen === 2
        ? "Получить за 777 ₽"
        : submitting
          ? "Открываем оплату…"
          : "Всё верно — оплатить";

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--background)]/75 backdrop-blur-sm"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center max-lg:items-stretch lg:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Персональный отчёт"
          className="pointer-events-auto flex h-full w-full flex-col overflow-hidden bg-[var(--background)] lg:h-[min(88dvh,48rem)] lg:w-[42rem] lg:max-w-[calc(100%-3rem)] lg:rounded-2xl lg:border lg:border-[#F6E7A1]/45"
        >
        <PaywallBody
          instance="modal"
          screen={screen}
          steps={steps}
          extraPayload={extraPayload}
          form={form}
          error={error}
          submitting={submitting}
          confirmReady={confirmReady}
          cta={cta}
          onClose={onClose}
          onAdvance={onAdvance}
          onForm={(next) => {
            setError("");
            setForm(next);
          }}
        />
      </div>
    </div>
    </div>,
    window.document.body,
  );
}

function PaywallBody({
  instance,
  screen,
  steps,
  extraPayload,
  form,
  error,
  submitting,
  confirmReady,
  cta,
  onClose,
  onAdvance,
  onForm,
}: {
  instance: "modal";
  screen: PaywallScreen;
  steps: OnboardingStep[];
  extraPayload: Record<string, unknown>;
  form: ContactsAnswers;
  error: string;
  submitting: boolean;
  confirmReady: boolean;
  cta: string;
  onClose: () => void;
  onAdvance: () => void;
  onForm: (value: ContactsAnswers) => void;
}) {
  return (
    <div className="flex min-h-0 w-full flex-col overflow-hidden overscroll-none bg-[var(--background)] max-lg:h-full lg:h-full">
      <div className="flex shrink-0 justify-end px-5 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-6 lg:pt-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)]"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 lg:px-6">
        <div className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto overscroll-contain lg:max-w-none lg:overflow-y-hidden">
          {screen === 1 ? (
            <InsightFunnel
              screenIndex={1}
              insight={PAYWALL_INSIGHT}
              steps={steps}
              payloadByStep={{}}
              extraPayload={extraPayload}
              className="pt-2 pb-0 lg:max-w-none lg:justify-start"
            />
          ) : null}

          {screen === 2 ? (
            <InsightFunnel
              screenIndex={INSIGHT_OFFER_INDEX}
              insight={PAYWALL_INSIGHT}
              steps={steps}
              payloadByStep={{}}
              extraPayload={extraPayload}
              className="pt-2 pb-0 lg:max-w-none lg:justify-start"
            />
          ) : null}

          {screen === 3 ? (
            <PaywallContacts
              instance={instance}
              value={form}
              error={error}
              submitting={submitting}
              onChange={onForm}
            />
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-lg shrink-0 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-none lg:pb-6">
          {error && screen !== 3 ? (
            <p className="mb-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onAdvance}
            disabled={screen === 3 && (submitting || !confirmReady)}
            className="cabinet-cta min-h-11 w-full disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:bg-white/12"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaywallContacts({
  instance,
  value,
  onChange,
  error,
  submitting,
}: {
  instance: "modal";
  value: ContactsAnswers;
  onChange: (value: ContactsAnswers) => void;
  error: string;
  submitting: boolean;
}) {
  const emailId = `paywall-email-${instance}`;
  const telegramId = `paywall-telegram-${instance}`;
  const offerId = `paywall-offer-${instance}`;
  const telegramInvalid = Boolean(value.telegram.trim()) && !isValidTelegram(value.telegram);
  const emailInvalid = Boolean(value.email.trim()) && !isValidEmail(value.email);
  const showSupport =
    telegramInvalid ||
    emailInvalid ||
    (Boolean(error) &&
      (error === CONTACTS_SUPPORT ||
        error.toLowerCase().includes("telegram") ||
        error.toLowerCase().includes("email") ||
        error.toLowerCase().includes("реальн")));

  return (
    <div className="flex flex-col pt-2">
      <h2 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl">
        Проверь <span className="font-display italic text-[#F6E7A1]">почту</span>
      </h2>
      <p className="mt-4 text-base font-normal leading-relaxed text-white/75">
        Сюда придёт PDF-разбор. Telegram нужен, чтобы отправить доступ к кабинету.
      </p>
      <div className="mt-7 flex flex-col gap-6">
        <div>
          <label htmlFor={emailId} className="text-xs uppercase tracking-[0.16em] text-white/40">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            required
            autoComplete="email"
            disabled={submitting}
            placeholder="you@example.com"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            aria-invalid={emailInvalid || undefined}
            className={`mt-3 w-full border-b bg-transparent pb-3 text-xl text-white outline-none placeholder:text-white/30 focus:border-[#F6E7A1] sm:text-2xl [color-scheme:dark] ${
              emailInvalid ? "border-[#F6E7A1]" : "border-white/20"
            }`}
          />
        </div>
        <div>
          <label htmlFor={telegramId} className="text-xs uppercase tracking-[0.16em] text-white/40">
            Telegram
          </label>
          <input
            id={telegramId}
            type="text"
            name="telegram"
            required
            disabled={submitting}
            placeholder="@username"
            value={value.telegram}
            onChange={(event) => onChange({ ...value, telegram: event.target.value })}
            aria-invalid={telegramInvalid || undefined}
            className={`mt-3 w-full border-b bg-transparent pb-3 text-xl text-white outline-none placeholder:text-white/30 focus:border-[#F6E7A1] sm:text-2xl [color-scheme:dark] ${
              telegramInvalid ? "border-[#F6E7A1]" : "border-white/20"
            }`}
          />
        </div>
        {showSupport ? (
          <p className="-mt-2 text-sm font-normal text-[#F6E7A1]/90" role="status">
            {CONTACTS_SUPPORT}
          </p>
        ) : null}
        <label htmlFor={offerId} className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/65">
          <input
            id={offerId}
            type="checkbox"
            name="offer_consent"
            required
            checked={value.offer_consent}
            disabled={submitting}
            onChange={(event) => onChange({ ...value, offer_consent: event.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#F6E7A1]"
          />
          <span>
            Принимаю{" "}
            <a
              href="/offer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F6E7A1] underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              публичную оферту
            </a>
          </span>
        </label>
        {error && !showSupport && error.toLowerCase().includes("оферт") ? (
          <p className="-mt-2 text-sm text-[#F6E7A1]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
