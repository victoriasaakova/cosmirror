"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchOnboardingInsight,
  fetchOnboardingSession,
  fetchOnboardingSteps,
  submitOnboardingStep,
  suggestPlaces,
  type OnboardingInsight,
  type OnboardingStep,
  type PlaceSuggestion,
} from "@/lib/api";
import {
  adjacentStep,
  buildProgressModel,
  firstIncompleteScreenIndex,
  INSIGHT_SLUG,
  isReservedSlug,
  mergeContentPayloads,
  nextStepHref,
  prevStepHref,
  progressIndexFor,
  screenIsComplete,
  screensForStep,
  stepHref,
  type ContentScreen,
  type TitlePart,
} from "@/lib/onboarding/screens";
import {
  INSIGHT_SCREEN_COUNT,
  InsightFunnel,
  insightCtaLabel,
} from "@/components/InsightFunnel";
import {
  ensureSessionToken,
  patchDraft,
  readDraft,
} from "@/lib/onboarding/session";

type BirthAnswers = {
  birth_date: string;
  birth_place: string;
  birth_time: string;
  unknown_time: boolean;
  birth_lat: number | null;
  birth_lng: number | null;
  timezone: string;
};

type ContactsAnswers = {
  email: string;
  telegram: string;
  pd_consent: boolean;
};

const EMPTY_BIRTH: BirthAnswers = {
  birth_date: "",
  birth_place: "",
  birth_time: "",
  unknown_time: false,
  birth_lat: null,
  birth_lng: null,
  timezone: "",
};

const EMPTY_CONTACTS: ContactsAnswers = {
  email: "",
  telegram: "",
  pd_consent: false,
};

function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}.${month}`;
  return `${day}.${month}.${year}`;
}

function toIsoDate(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
      return null;
    }
    return v;
  }
  const match = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function choiceClass(active: boolean) {
  return `w-full rounded-[1.35rem] border px-5 py-4 text-left font-display text-lg leading-snug transition-all sm:text-xl ${
    active
      ? "border-[#ff7b36]/70 bg-[#ff7b36]/15 text-white shadow-[0_0_28px_rgba(255,123,54,0.18)]"
      : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/30 hover:text-white"
  }`;
}

function fieldClass() {
  return "mt-3 w-full border-b border-white/20 bg-transparent pb-3 font-display text-xl text-white outline-none placeholder:text-white/30 focus:border-[#ff7b36] sm:text-2xl [color-scheme:dark]";
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? "";
}

function renderTitle(parts: TitlePart[]) {
  return parts.map((part, index) =>
    part.accent ? (
      <span key={index} className="font-display italic text-[#ff7b36]">
        {part.t}
      </span>
    ) : (
      <span key={index}>{part.t}</span>
    ),
  );
}

function birthFromPayload(payload: Record<string, unknown> | undefined): BirthAnswers {
  if (!payload) return { ...EMPTY_BIRTH };
  return {
    birth_date:
      typeof payload.birth_date_display === "string"
        ? payload.birth_date_display
        : typeof payload.birth_date === "string"
          ? payload.birth_date.includes("-")
            ? (() => {
                const [y, m, d] = payload.birth_date.split("-");
                return y && m && d ? `${d}.${m}.${y}` : "";
              })()
            : payload.birth_date
          : "",
    birth_place: typeof payload.birth_place === "string" ? payload.birth_place : "",
    birth_time: typeof payload.birth_time === "string" ? payload.birth_time : "",
    unknown_time: Boolean(payload.unknown_time),
    birth_lat: typeof payload.birth_lat === "number" ? payload.birth_lat : null,
    birth_lng: typeof payload.birth_lng === "number" ? payload.birth_lng : null,
    timezone: typeof payload.timezone === "string" ? payload.timezone : "",
  };
}

function contactsFromPayload(payload: Record<string, unknown> | undefined): ContactsAnswers {
  if (!payload) return { ...EMPTY_CONTACTS };
  return {
    email: typeof payload.email === "string" ? payload.email : "",
    telegram: typeof payload.telegram === "string" ? payload.telegram : "",
    pd_consent: Boolean(payload.pd_consent),
  };
}

function ctaLabel(step: OnboardingStep | null, submitting: boolean): string {
  if (!step) return "Продолжить";
  if (step.step_type === "birth_data") {
    return submitting ? "Считаем карту…" : "Посмотреть карту";
  }
  if (step.step_type === "waitlist") {
    return submitting ? "Открываем…" : "Показать результат";
  }
  return "Продолжить";
}

export function OnboardingFlow({ slug }: { slug: string }) {
  const router = useRouter();
  const [steps, setSteps] = useState<OnboardingStep[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [payloadByStep, setPayloadByStep] = useState<Record<string, Record<string, unknown>>>({});
  const [screenIndex, setScreenIndex] = useState(0);
  const [insight, setInsight] = useState<OnboardingInsight | null>(null);
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "ready" | "missing">(
    "idle",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentStep = useMemo(
    () => (steps && !isReservedSlug(slug) ? steps.find((step) => step.slug === slug) : null),
    [steps, slug],
  );

  const contentScreens = useMemo(
    () => (currentStep ? screensForStep(currentStep) : []),
    [currentStep],
  );

  const progress = useMemo(() => {
    if (!steps) return { total: 0, index: 0 };
    if (isReservedSlug(slug)) {
      return { total: INSIGHT_SCREEN_COUNT, index: screenIndex };
    }
    const model = buildProgressModel(steps);
    return {
      total: model.total,
      index: progressIndexFor(steps, slug, screenIndex),
    };
  }, [steps, slug, screenIndex]);

  const warm = useCallback(async () => {
    try {
      const [apiSteps, token] = await Promise.all([
        fetchOnboardingSteps(),
        ensureSessionToken(),
      ]);
      setSessionToken(token);
      setSteps(apiSteps);

      const [draft, session] = await Promise.all([
        Promise.resolve(readDraft()),
        fetchOnboardingSession(token),
      ]);

      const byStep: Record<string, Record<string, unknown>> = { ...draft.byStep };
      for (const answer of session.answers) {
        const payload =
          answer.payload && typeof answer.payload === "object"
            ? (answer.payload as Record<string, unknown>)
            : {};
        byStep[answer.step_slug] = { ...(byStep[answer.step_slug] ?? {}), ...payload };
      }
      setPayloadByStep(byStep);
      patchDraft({ byStep });

      const stepMeta = apiSteps.find((step) => step.slug === slug);
      const screens = stepMeta ? screensForStep(stepMeta) : [];
      const payload = byStep[slug] ?? {};
      const resumeScreen =
        screens.length > 0
          ? firstIncompleteScreenIndex(screens, payload)
          : typeof draft.screenIndexByStep[slug] === "number"
            ? draft.screenIndexByStep[slug]
            : 0;
      setScreenIndex(resumeScreen);
      patchDraft({ stepSlug: slug, screenIndex: resumeScreen });

      if (isReservedSlug(slug)) {
        setInsightStatus("loading");
        try {
          const data = await fetchOnboardingInsight(token);
          setInsight(data);
          setInsightStatus("ready");
        } catch {
          setInsightStatus("missing");
        }
        return;
      }

      setInsightStatus("idle");
      const known = apiSteps.some((step) => step.slug === slug);
      if (!known) {
        const first = apiSteps[0];
        router.replace(first ? stepHref(first.slug) : "/");
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Не удалось загрузить онбординг");
    }
  }, [router, slug]);

  useEffect(() => {
    void warm();
  }, [warm]);

  useEffect(() => {
    const draft = readDraft();
    const saved = draft.screenIndexByStep[slug];
    setScreenIndex(typeof saved === "number" ? saved : 0);
    setError("");
  }, [slug]);

  useEffect(() => {
    if (!isReservedSlug(slug) || !steps || insightStatus !== "missing") return;
    const waitlist = [...steps].reverse().find((step) => step.step_type === "waitlist");
    router.replace(waitlist ? stepHref(waitlist.slug) : stepHref(steps[0]?.slug ?? "welcome"));
  }, [slug, steps, insightStatus, router]);

  function updateStepPayload(stepSlug: string, patch: Record<string, unknown>) {
    setPayloadByStep((prev) => {
      const next = {
        ...prev,
        [stepSlug]: { ...(prev[stepSlug] ?? {}), ...patch },
      };
      patchDraft({ byStep: next });
      return next;
    });
  }

  function setScreen(nextIndex: number) {
    setScreenIndex(nextIndex);
    patchDraft({ stepSlug: slug, screenIndex: nextIndex });
  }

  async function goTo(href: string) {
    router.push(href);
  }

  function goBack() {
    setError("");
    if (isReservedSlug(slug)) {
      if (screenIndex > 0) {
        setScreen(screenIndex - 1);
        return;
      }
      if (steps?.length) {
        void goTo(stepHref(steps[steps.length - 1].slug));
      }
      return;
    }
    if (
      currentStep &&
      (currentStep.step_type === "content" ||
        currentStep.step_type === "input" ||
        currentStep.step_type === "custom") &&
      contentScreens.length > 0 &&
      screenIndex > 0
    ) {
      setScreen(screenIndex - 1);
      return;
    }
    if (!steps) return;
    const prev = prevStepHref(steps, slug);
    if (prev) {
      // Land on last screen of previous multi-screen step
      const prevStep = adjacentStep(steps, slug, -1);
      if (prevStep) {
        const screens = screensForStep(prevStep);
        if (screens.length > 1) {
          patchDraft({ stepSlug: prevStep.slug, screenIndex: screens.length - 1 });
        }
      }
      void goTo(prev);
      return;
    }
    router.push("/");
  }

  async function persistStep(stepSlug: string, payload: Record<string, unknown>, completed: boolean) {
    const token = sessionToken ?? (await ensureSessionToken());
    setSessionToken(token);
    await submitOnboardingStep(token, stepSlug, payload, completed);
    updateStepPayload(stepSlug, payload);
    return token;
  }

  async function completeCurrentStep(payload: Record<string, unknown>) {
    if (!currentStep || !steps) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await persistStep(currentStep.slug, payload, true);

      if (currentStep.step_type === "birth_data") {
        try {
          const data = await fetchOnboardingInsight(token);
          setInsight(data);
          patchDraft({ insightReady: true });
        } catch {
          // Contacts still unlock; insight fetched again there / on insight page.
        }
      }

      if (currentStep.step_type === "waitlist") {
        if (!insight) {
          const data = await fetchOnboardingInsight(token);
          setInsight(data);
        }
        patchDraft({ insightReady: true });
        await goTo(stepHref(INSIGHT_SLUG));
        return;
      }

      await goTo(nextStepHref(steps, currentStep.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить шаг");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!currentStep || submitting) return;

    if (
      currentStep.step_type === "content" ||
      currentStep.step_type === "input" ||
      currentStep.step_type === "custom"
    ) {
      const payload = {
        ...(payloadByStep[currentStep.slug] ?? {}),
        _screen:
          contentScreens.length > 0
            ? contentScreens[screenIndex]?.id ?? screenIndex
            : "acknowledge",
      };
      if (contentScreens.length > 0) {
        const screen = contentScreens[screenIndex];
        if (!screenIsComplete(screen, payload)) return;
        if (screenIndex < contentScreens.length - 1) {
          setSubmitting(true);
          setError("");
          try {
            await persistStep(currentStep.slug, payload, false);
            setScreen(screenIndex + 1);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось сохранить ответ");
          } finally {
            setSubmitting(false);
          }
          return;
        }
        await completeCurrentStep(payload);
        return;
      }
      await completeCurrentStep({
        ...payload,
        acknowledged: true,
        title: currentStep.title,
      });
      return;
    }

    if (currentStep.step_type === "birth_data") {
      const birth = birthFromPayload(payloadByStep[currentStep.slug]);
      const isoDate = toIsoDate(birth.birth_date);
      if (!isoDate) {
        setError("Укажи дату рождения в формате дд.мм.гггг");
        return;
      }
      if (birth.birth_place.trim().length < 2) {
        setError("Укажи город рождения");
        return;
      }
      const payload: Record<string, unknown> = {
        birth_date: isoDate,
        birth_date_display: birth.birth_date,
        birth_place: birth.birth_place.trim(),
        unknown_time: birth.unknown_time,
      };
      if (!birth.unknown_time && birth.birth_time) payload.birth_time = birth.birth_time;
      if (birth.birth_lat != null && birth.birth_lng != null) {
        payload.birth_lat = birth.birth_lat;
        payload.birth_lng = birth.birth_lng;
      }
      if (birth.timezone) payload.timezone = birth.timezone;
      await completeCurrentStep(payload);
      return;
    }

    if (currentStep.step_type === "waitlist") {
      const contacts = contactsFromPayload(payloadByStep[currentStep.slug]);
      if (!contacts.telegram.trim()) {
        setError("Укажи Telegram");
        return;
      }
      if (!isValidEmail(contacts.email)) {
        setError("Укажи корректный email");
        return;
      }
      if (!contacts.pd_consent) {
        setError("Нужно согласие на обработку персональных данных");
        return;
      }

      // Prefer name / quiz summary from any earlier content step.
      const contentPayload = mergeContentPayloads(steps ?? [], payloadByStep);

      const focus = Array.isArray(contentPayload.focus)
        ? (contentPayload.focus as string[])
        : [];
      const focusScreens = steps
        ?.flatMap((step) => screensForStep(step))
        .find((screen) => screen.field === "focus");
      const intentScreen = steps
        ?.flatMap((step) => screensForStep(step))
        .find((screen) => screen.field === "intent");
      const lifeScreen = steps
        ?.flatMap((step) => screensForStep(step))
        .find((screen) => screen.field === "life_stage");

      await completeCurrentStep({
        email: contacts.email.trim(),
        telegram: contacts.telegram.trim(),
        name: typeof contentPayload.name === "string" ? contentPayload.name.trim() : "",
        source: "onboarding",
        pd_consent: true,
        pd_consent_at: new Date().toISOString(),
        message: [
          focus.length && focusScreens && focusScreens.kind === "multi"
            ? `Фокус: ${focus.map((f) => labelFor(focusScreens.options, f)).join(", ")}`
            : "",
          typeof contentPayload.intent === "string" && intentScreen && intentScreen.kind !== "text"
            ? `Цель: ${labelFor(intentScreen.options, contentPayload.intent)}`
            : "",
          typeof contentPayload.life_stage === "string" &&
          lifeScreen &&
          lifeScreen.kind !== "text"
            ? `Период: ${labelFor(lifeScreen.options, contentPayload.life_stage)}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }

  const payload = currentStep ? (payloadByStep[currentStep.slug] ?? {}) : {};
  const ready = (() => {
    if (!currentStep || submitting) return !submitting && Boolean(currentStep);
    if (currentStep.step_type === "birth_data") {
      const birth = birthFromPayload(payload);
      return (
        !submitting &&
        Boolean(toIsoDate(birth.birth_date)) &&
        birth.birth_place.trim().length >= 2
      );
    }
    if (currentStep.step_type === "waitlist") {
      const contacts = contactsFromPayload(payload);
      return (
        !submitting &&
        Boolean(contacts.telegram.trim()) &&
        isValidEmail(contacts.email) &&
        contacts.pd_consent
      );
    }
    if (contentScreens.length > 0) {
      return screenIsComplete(contentScreens[screenIndex], payload);
    }
    return true;
  })();

  const showProgress = Boolean(currentStep) || (isReservedSlug(slug) && Boolean(insight));
  const isFirstScreen =
    Boolean(currentStep) &&
    !prevStepHref(steps ?? [], slug) &&
    screenIndex === 0;

  if (loadError) {
    return (
      <main className="relative flex h-[100dvh] flex-1 items-center justify-center bg-[#07070c] px-5 text-center text-white">
        <div>
          <p className="text-white/70">{loadError}</p>
          <button
            type="button"
            className="mt-6 rounded-full bg-white px-8 py-3 font-display text-black"
            onClick={() => void warm()}
          >
            Повторить
          </button>
        </div>
      </main>
    );
  }

  if (!steps) {
    return (
      <main className="relative flex h-[100dvh] flex-1 items-center justify-center bg-[#07070c] text-white/50">
        Загружаем…
      </main>
    );
  }

  return (
    <main className="relative flex h-[100dvh] flex-1 flex-col overflow-hidden">
      <Image
        src="/images/cosmirror-bottom-landscape.png"
        alt=""
        fill
        priority
        className="object-cover object-bottom"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#07070c] via-[#07070c]/75 to-[#07070c]/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/90"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:px-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between">
          {isFirstScreen && !isReservedSlug(slug) ? (
            <Link
              href="/"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:border-white/30 hover:text-white"
              aria-label="На главную"
            >
              <BackIcon />
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:border-white/30 hover:text-white"
              aria-label="Назад"
            >
              <BackIcon />
            </button>
          )}

          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight text-white transition hover:opacity-90"
          >
            Cosmirror
          </Link>

          <span className="w-11" aria-hidden />
        </div>

        {showProgress ? (
          <div className="mx-auto mt-8 flex w-full max-w-lg shrink-0 items-center justify-center gap-1.5">
            {Array.from({ length: progress.total }).map((_, index) => {
              const active = index === progress.index;
              const done = index < progress.index;
              return (
                <span
                  key={index}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active
                      ? "w-7 bg-[#ff7b36]"
                      : done
                        ? "w-4 bg-[#ff7b36]/55"
                        : "w-4 bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        ) : null}

        {isReservedSlug(slug) && insight ? (
          <div className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-2 md:pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
              <InsightFunnel
                screenIndex={screenIndex}
                insight={insight}
                steps={steps}
                payloadByStep={payloadByStep}
              />
            </div>
            <div className="shrink-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/95 to-transparent pt-3">
              {screenIndex >= INSIGHT_SCREEN_COUNT - 1 ? (
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98] md:text-xl"
                >
                  {insightCtaLabel(screenIndex, insight)}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setScreen(screenIndex + 1)}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98] md:text-xl"
                >
                  {insightCtaLabel(screenIndex, insight)}
                </button>
              )}
            </div>
          </div>
        ) : currentStep ? (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 md:pt-10"
          >
            <div className="reveal min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
              <StepBody
                step={currentStep}
                screens={contentScreens}
                screenIndex={screenIndex}
                payload={payload}
                error={error}
                submitting={submitting}
                onPayload={(patch) => {
                  setError("");
                  updateStepPayload(currentStep.slug, patch);
                }}
              />
            </div>

            {error ? (
              <p className="mb-2 shrink-0 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <div className="shrink-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/95 to-transparent pt-3">
              <button
                type="submit"
                disabled={!ready}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 md:text-xl"
              >
                {ctaLabel(currentStep, submitting)}
              </button>
            </div>
          </form>
        ) : (
          <div className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center text-white/50">
            Загружаем…
          </div>
        )}
      </div>
    </main>
  );
}

function StepBody({
  step,
  screens,
  screenIndex,
  payload,
  error,
  submitting,
  onPayload,
}: {
  step: OnboardingStep;
  screens: ContentScreen[];
  screenIndex: number;
  payload: Record<string, unknown>;
  error: string;
  submitting: boolean;
  onPayload: (patch: Record<string, unknown>) => void;
}) {
  if (step.step_type === "birth_data") {
    return (
      <BirthStep
        value={birthFromPayload(payload)}
        onChange={(next) =>
          onPayload({
            ...next,
            birth_date_display: next.birth_date,
          })
        }
        error={error}
        submitting={submitting}
      />
    );
  }

  if (step.step_type === "waitlist") {
    return (
      <ContactsStep
        value={contactsFromPayload(payload)}
        onChange={(next) => onPayload({ ...next })}
        submitting={submitting}
      />
    );
  }

  if (screens.length > 0) {
    return (
      <ContentScreenView
        screen={screens[Math.min(screenIndex, screens.length - 1)]}
        payload={payload}
        onPayload={onPayload}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {step.title}
      </h1>
      {step.subtitle ? (
        <p className="mt-3 text-sm font-light leading-relaxed text-white/50">{step.subtitle}</p>
      ) : null}
    </div>
  );
}

function ContentScreenView({
  screen,
  payload,
  onPayload,
}: {
  screen: ContentScreen;
  payload: Record<string, unknown>;
  onPayload: (patch: Record<string, unknown>) => void;
}) {
  if (screen.kind === "text") {
    const value = typeof payload[screen.field] === "string" ? (payload[screen.field] as string) : "";
    return (
      <div className="flex flex-col">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          {renderTitle(screen.title)}
        </h1>
        <label htmlFor={`onboarding-${screen.field}`} className="sr-only">
          {screen.field}
        </label>
        <input
          id={`onboarding-${screen.field}`}
          type={screen.inputType ?? "text"}
          name={screen.field}
          autoComplete={screen.autocomplete}
          autoFocus
          placeholder={screen.placeholder}
          value={value}
          onChange={(event) => onPayload({ [screen.field]: event.target.value })}
          className="mt-10 w-full border-b border-white/20 bg-transparent pb-3 font-display text-2xl text-white outline-none placeholder:text-white/30 focus:border-[#ff7b36] sm:text-3xl"
        />
      </div>
    );
  }

  if (screen.kind === "single") {
    const value = typeof payload[screen.field] === "string" ? (payload[screen.field] as string) : "";
    return (
      <div className="flex flex-col">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
          {renderTitle(screen.title)}
        </h1>
        <div
          className={`mt-10 grid gap-3 ${screen.columns === 2 ? "grid-cols-2 sm:grid-cols-2" : ""}`}
        >
          {screen.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPayload({ [screen.field]: option.value })}
              className={`${choiceClass(value === option.value)} ${screen.columns === 2 ? "text-center" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const values = Array.isArray(payload[screen.field])
    ? (payload[screen.field] as string[])
    : [];
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {renderTitle(screen.title)}
      </h1>
      {screen.hint ? (
        <p className="mt-3 text-sm font-light text-white/50">{screen.hint}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3">
        {screen.options.map((option) => {
          const active = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active
                  ? values.filter((item) => item !== option.value)
                  : [...values, option.value];
                onPayload({ [screen.field]: next });
              }}
              className={choiceClass(active)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BirthStep({
  value,
  onChange,
  error,
  submitting,
}: {
  value: BirthAnswers;
  onChange: (value: BirthAnswers) => void;
  error: string;
  submitting: boolean;
}) {
  const dateInvalid = Boolean(error && !toIsoDate(value.birth_date));
  const placeInvalid = Boolean(error && value.birth_place.trim().length < 2);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const q = value.birth_place.trim();
    if (q.length < 2 || value.birth_lat != null) {
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
  }, [value.birth_place, value.birth_lat]);

  function pickPlace(item: PlaceSuggestion) {
    onChange({
      ...value,
      birth_place: item.place,
      birth_lat: item.latitude,
      birth_lng: item.longitude,
      timezone: item.timezone,
    });
    setSuggestions([]);
    setSuggestOpen(false);
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя <span className="font-display italic text-[#ff7b36]">натальная карта</span>
      </h1>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/50">
        Введи данные рождения — посчитаем карту и покажем, что может влиять на фоне текущих циклов.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <div>
          <label htmlFor="birth-date" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Дата рождения
          </label>
          <input
            id="birth-date"
            type="text"
            name="birth_date"
            inputMode="numeric"
            autoComplete="bday"
            disabled={submitting}
            placeholder="дд.мм.гггг"
            maxLength={10}
            value={value.birth_date}
            onChange={(event) =>
              onChange({ ...value, birth_date: formatBirthDateInput(event.target.value) })
            }
            aria-invalid={dateInvalid}
            className={`${fieldClass()} ${dateInvalid ? "!border-[#ff7b36]" : ""}`}
          />
        </div>

        <div className="relative">
          <label htmlFor="birth-place" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Город рождения
          </label>
          <input
            id="birth-place"
            type="text"
            name="birth_place"
            autoComplete="off"
            disabled={submitting}
            placeholder="Начни вводить город"
            value={value.birth_place}
            onChange={(event) =>
              onChange({
                ...value,
                birth_place: event.target.value,
                birth_lat: null,
                birth_lng: null,
                timezone: "",
              })
            }
            onFocus={() => {
              if (suggestions.length > 0) setSuggestOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setSuggestOpen(false), 150);
            }}
            aria-invalid={placeInvalid}
            aria-autocomplete="list"
            aria-expanded={suggestOpen}
            className={`${fieldClass()} ${placeInvalid ? "!border-[#ff7b36]" : ""}`}
          />
          {suggestLoading ? (
            <p className="mt-2 text-xs font-light text-white/35">Ищем города…</p>
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
                    onClick={() => pickPlace(item)}
                  >
                    {item.place}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <label htmlFor="birth-time" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Время рождения
          </label>
          <input
            id="birth-time"
            type="time"
            name="birth_time"
            disabled={submitting || value.unknown_time}
            value={value.unknown_time ? "" : value.birth_time}
            onChange={(event) =>
              onChange({ ...value, birth_time: event.target.value, unknown_time: false })
            }
            className={`${fieldClass()} ${value.unknown_time ? "opacity-35" : ""}`}
          />
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={value.unknown_time}
              disabled={submitting}
              onChange={(event) =>
                onChange({
                  ...value,
                  unknown_time: event.target.checked,
                  birth_time: event.target.checked ? "" : value.birth_time,
                })
              }
              className="mt-0.5 h-4 w-4 accent-[#ff7b36]"
            />
            <span>Не знаю точное время рождения</span>
          </label>
          {value.unknown_time ? (
            <p className="mt-2 text-xs font-light text-white/40">
              Будут Солнце и Луна. Асцендент и дома появятся, когда укажешь время.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContactsStep({
  value,
  onChange,
  submitting,
}: {
  value: ContactsAnswers;
  onChange: (value: ContactsAnswers) => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя карта <span className="font-display italic text-[#ff7b36]">готова</span>
      </h1>
      <p className="mt-4 font-display text-xl leading-snug text-white/85 sm:text-2xl">
        Оставь контакты, чтобы открыть разбор
      </p>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/50">
        Мы используем твои контакты только для доступа к Cosmirror, уведомлений о запуске и обновлений
        по продукту. Спамить не будем.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <div>
          <label
            htmlFor="contact-telegram"
            className="text-xs uppercase tracking-[0.16em] text-white/40"
          >
            Telegram
          </label>
          <input
            id="contact-telegram"
            type="text"
            name="telegram"
            required
            disabled={submitting}
            placeholder="@username"
            value={value.telegram}
            onChange={(event) => onChange({ ...value, telegram: event.target.value })}
            className={fieldClass()}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            disabled={submitting}
            placeholder="you@example.com"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            className={fieldClass()}
          />
        </div>

        <PdConsentCheckbox
          id="contact-pd-consent"
          checked={value.pd_consent}
          disabled={submitting}
          onChange={(checked) => onChange({ ...value, pd_consent: checked })}
          includeTerms
        />
      </div>
    </div>
  );
}

function PdConsentCheckbox({
  id,
  checked,
  disabled,
  onChange,
  includeTerms = false,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  includeTerms?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/65">
      <input
        id={id}
        type="checkbox"
        name="pd_consent"
        required
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff7b36]"
      />
      <span>
        Соглашаюсь на{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ffb099] underline-offset-2 hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          обработку персональных данных
        </a>
        {includeTerms ? (
          <>
            {" "}
            и принимаю{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffb099] underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Пользовательское соглашение
            </a>
          </>
        ) : null}
      </span>
    </label>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
