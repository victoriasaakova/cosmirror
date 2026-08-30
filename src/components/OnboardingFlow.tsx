"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { StarCheckPreloader, StarCheckPreloaderPage } from "@/components/StarCheckPreloader";
import {
  completeYandexAuth,
  createOrder,
  fetchMe,
  fetchOnboardingInsight,
  fetchOnboardingInsightReady,
  fetchOnboardingSession,
  fetchOnboardingSteps,
  startYandexAuth,
  submitOnboardingStep,
  suggestPlaces,
  type OnboardingInsight,
  type OnboardingStep,
  type PlaceSuggestion,
} from "@/lib/api";
import { writeAuthToken, readAuthToken, clearAuthNext } from "@/lib/auth";
import { captureEvent } from "@/lib/posthog-client";
import { destinationAfterYandexLogin } from "@/lib/yandex-login";
import { useAuth } from "@/components/AuthProvider";
import {
  adjacentStep,
  buildProgressModel,
  canonicalOnboardingSlug,
  firstIncompleteScreenIndex,
  insightHrefForScreen,
  insightScreenForSlug,
  INSIGHT_SLUG,
  isReservedSlug,
  LEGACY_ONBOARDING_SLUGS,
  mergeContentPayloads,
  nextStepHref,
  prevStepHref,
  progressIndexFor,
  REPORT_SLUG,
  screenIsComplete,
  screensForStep,
  stepHref,
  type ContentScreen,
  type TitlePart,
} from "@/lib/onboarding/screens";
import { sanitizePersonName, sanitizePersonNameInput } from "@/lib/person-name";
import {
  INSIGHT_CONFIRM_INDEX,
  INSIGHT_OFFER_INDEX,
  INSIGHT_SCREEN_COUNT,
  InsightFunnel,
  insightCtaLabel,
} from "@/components/InsightFunnel";
import {
  clearOnboardingClientState,
  ensureSessionToken,
  getOrderIdempotencyKey,
  patchDraft,
  readDraft,
  rotateOrderIdempotencyKey,
  startFreshOnboardingSession,
  writeLastOrderId,
} from "@/lib/onboarding/session";

function remapLegacyPayloads(
  byStep: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
  const next = { ...byStep };
  for (const [oldSlug, newSlug] of Object.entries(LEGACY_ONBOARDING_SLUGS)) {
    if (next[oldSlug] && !next[newSlug]) {
      next[newSlug] = next[oldSlug];
    }
  }
  return next;
}

function insightIndexForSlug(slug: string, saved?: number): number {
  if (slug === REPORT_SLUG && saved === INSIGHT_CONFIRM_INDEX) {
    return INSIGHT_CONFIRM_INDEX;
  }
  return insightScreenForSlug(slug);
}

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
  offer_consent: boolean;
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
  offer_consent: false,
};

const PAY_WINDOW_NAME = "cosmirror-prodamus";

function checkoutUsesNewTab() {
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openPayWindow(): Window | null {
  if (!checkoutUsesNewTab()) return null;
  if (window.name === PAY_WINDOW_NAME) window.name = "";
  const child = window.open("", PAY_WINDOW_NAME);
  if (!child || child === window) return null;
  try {
    child.document.open();
    child.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Cosmirror</title>
<style>html,body{height:100%;margin:0;background:#050d4a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}</style>
</head><body><p>открываем оплату…</p></body></html>`);
    child.document.close();
  } catch {
    /* ignore */
  }
  return child;
}

function goToPayment(url: string, payWindow: Window | null) {
  if (payWindow && !payWindow.closed) {
    payWindow.location.replace(url);
    window.location.assign("/account/");
    return;
  }
  window.location.assign(url);
}

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

/** Telegram username: @name или name, 5–32 символа, латиница/цифры/_ */
function normalizeTelegram(value: string) {
  let raw = value.trim();
  raw = raw.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "");
  raw = raw.replace(/^@/, "");
  return raw;
}

function isValidTelegram(value: string) {
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(normalizeTelegram(value));
}

const CONTACTS_SUPPORT =
  "Введи реальные данные — нужно верифицировать Telegram и email";

function choiceClass(active: boolean) {
  return `w-full rounded-2xl border px-5 py-4 text-left text-lg font-medium leading-snug transition-colors sm:text-xl ${
    active
      ? "border-[#F6E7A1] bg-white/[0.03] text-[#F6E7A1]"
      : "border-white/15 bg-white/[0.03] text-white/75 hover:border-[#F6E7A1] hover:text-[#F6E7A1]"
  }`;
}

function fieldClass() {
  return "mt-3 w-full border-b border-white/20 bg-transparent pb-3 text-xl text-white outline-none placeholder:text-white/30 focus:border-[#F6E7A1] sm:text-2xl [color-scheme:dark]";
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? "";
}

function renderTitle(parts: TitlePart[]) {
  return parts.map((part, index) =>
    part.accent ? (
      <span key={index} className="font-display italic text-[#F6E7A1]">
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
    offer_consent: Boolean(payload.offer_consent),
  };
}

function waitlistStepOf(steps: OnboardingStep[] | null | undefined): OnboardingStep | undefined {
  return steps?.find((step) => step.step_type === "waitlist");
}

function readYandexHash(): { auth: string; sessionToken: string } {
  if (typeof window === "undefined") return { auth: "", sessionToken: "" };
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    auth: params.get("auth") || "",
    sessionToken: params.get("session_token") || "",
  };
}

function withAuthedEmail(
  steps: OnboardingStep[],
  byStep: Record<string, Record<string, unknown>>,
  email: string,
): Record<string, Record<string, unknown>> {
  const waitlist = waitlistStepOf(steps);
  if (!waitlist || !email.trim()) return byStep;
  const current = byStep[waitlist.slug] ?? {};
  if (typeof current.email === "string" && current.email.trim()) return byStep;
  return {
    ...byStep,
    [waitlist.slug]: { ...current, email: email.trim() },
  };
}

function birthStepOf(steps: OnboardingStep[] | null | undefined): OnboardingStep | undefined {
  return steps?.find((step) => step.step_type === "birth_data");
}

function persistableBirthPayload(
  payloadByStep: Record<string, Record<string, unknown>>,
  birthSlug: string,
): Record<string, unknown> | null {
  const birth = birthFromPayload(payloadByStep[birthSlug]);
  const isoDate = toIsoDate(birth.birth_date);
  if (!isoDate || birth.birth_place.trim().length < 2) return null;
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
  return payload;
}

function contactsAreValid(contacts: ContactsAnswers) {
  return isValidTelegram(contacts.telegram) && isValidEmail(contacts.email);
}

function buildWaitlistPayload(
  steps: OnboardingStep[],
  payloadByStep: Record<string, Record<string, unknown>>,
  contacts: ContactsAnswers,
): Record<string, unknown> {
  const waitlist = waitlistStepOf(steps);
  const existing = waitlist ? (payloadByStep[waitlist.slug] ?? {}) : {};
  const contentPayload = mergeContentPayloads(steps, payloadByStep);
  const focus = Array.isArray(contentPayload.focus) ? (contentPayload.focus as string[]) : [];
  const allScreens = steps.flatMap((step) => screensForStep(step));
  const focusScreens = allScreens.find((screen) => screen.field === "focus");
  const intentScreen = allScreens.find((screen) => screen.field === "intent");
  const lifeScreen = allScreens.find((screen) => screen.field === "life_stage");

  return {
    ...existing,
    email: contacts.email.trim(),
    telegram: contacts.telegram.trim(),
    name:
      typeof contentPayload.name === "string"
        ? contentPayload.name.trim()
        : typeof existing.name === "string"
          ? existing.name
          : "",
    source: typeof existing.source === "string" && existing.source ? existing.source : "onboarding",
    pd_consent: true,
    pd_consent_at:
      typeof existing.pd_consent_at === "string" && existing.pd_consent_at
        ? existing.pd_consent_at
        : new Date().toISOString(),
    offer_consent: Boolean(contacts.offer_consent),
    offer_consent_at: contacts.offer_consent
      ? typeof existing.offer_consent_at === "string" && existing.offer_consent_at
        ? existing.offer_consent_at
        : new Date().toISOString()
      : existing.offer_consent_at ?? "",
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

/** Переживает remount при смене /onboarding/[slug] — иначе каждый шаг мигает «Загружаем…». */
const flowCache: {
  steps: OnboardingStep[] | null;
  token: string | null;
  payloadByStep: Record<string, Record<string, unknown>>;
  insight: OnboardingInsight | null;
} = {
  steps: null,
  token: null,
  payloadByStep: {},
  insight: null,
};

export function resetOnboardingFlowCache() {
  // Каталог шагов общий — не сбрасываем, чтобы новый проход не мигал «Загружаем…».
  flowCache.token = null;
  flowCache.payloadByStep = {};
  flowCache.insight = null;
}

/** Прогрев списка шагов с лендинга — первый экран онбординга открывается без ожидания API. */
export function primeOnboardingSteps(apiSteps: OnboardingStep[]) {
  if (!apiSteps.length) return;
  flowCache.steps = apiSteps;
}

export function OnboardingFlow({
  slug,
  forceNew = false,
  oauthCode = "",
  oauthState = "",
  oauthError = "",
}: {
  slug: string;
  forceNew?: boolean;
  oauthCode?: string;
  oauthState?: string;
  oauthError?: string;
}) {
  const router = useRouter();
  const { user, ready: authReady, hasPaidReport, refresh: refreshAuth } = useAuth();
  const [showPaidMapCta, setShowPaidMapCta] = useState(false);
  const oauthHandledRef = useRef(false);
  const [steps, setSteps] = useState<OnboardingStep[] | null>(() => flowCache.steps);
  const [loadError, setLoadError] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    forceNew ? null : flowCache.token,
  );
  const [payloadByStep, setPayloadByStep] = useState<Record<string, Record<string, unknown>>>(
    () => (forceNew ? {} : flowCache.payloadByStep),
  );
  const [screenIndex, setScreenIndex] = useState(0);
  const [insight, setInsight] = useState<OnboardingInsight | null>(() =>
    forceNew ? null : flowCache.insight,
  );
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "ready" | "missing">(
    () => (!forceNew && flowCache.insight ? "ready" : "idle"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authedEmail, setAuthedEmail] = useState("");
  const [oauthBusy, setOauthBusy] = useState(Boolean(oauthCode));

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

  const applySteps = useCallback((apiSteps: OnboardingStep[]) => {
    flowCache.steps = apiSteps;
    setSteps(apiSteps);
  }, []);

  const applyToken = useCallback((token: string) => {
    flowCache.token = token;
    setSessionToken(token);
  }, []);

  const applyPayload = useCallback((byStep: Record<string, Record<string, unknown>>) => {
    flowCache.payloadByStep = byStep;
    setPayloadByStep(byStep);
  }, []);

  const applyInsight = useCallback((data: OnboardingInsight | null) => {
    flowCache.insight = data;
    setInsight(data);
  }, []);

  const warm = useCallback(async () => {
    try {
      setLoadError("");
      const hasCache = Boolean(flowCache.steps && flowCache.token);

      let apiSteps = flowCache.steps;
      let token = flowCache.token;

      if (!apiSteps || !token) {
        const [fetchedSteps, ensuredToken] = await Promise.all([
          fetchOnboardingSteps(),
          ensureSessionToken(),
        ]);
        apiSteps = fetchedSteps;
        token = ensuredToken;
        applySteps(fetchedSteps);
        applyToken(ensuredToken);

        const [draft, session] = await Promise.all([
          Promise.resolve(readDraft()),
          fetchOnboardingSession(ensuredToken),
        ]);

        const byStep: Record<string, Record<string, unknown>> = remapLegacyPayloads({
          ...draft.byStep,
        });
        for (const answer of session.answers) {
          const payload =
            answer.payload && typeof answer.payload === "object"
              ? (answer.payload as Record<string, unknown>)
              : {};
          byStep[answer.step_slug] = { ...(byStep[answer.step_slug] ?? {}), ...payload };
        }
        const remapped = remapLegacyPayloads(byStep);
        applyPayload(remapped);
        patchDraft({ byStep: remapped });
        if (session.user_email) {
          setAuthedEmail(session.user_email);
          const withEmail = withAuthedEmail(fetchedSteps, remapped, session.user_email);
          applyPayload(withEmail);
          patchDraft({ byStep: withEmail });
        }
      }

      const draft = readDraft();
      const byStep = remapLegacyPayloads(flowCache.payloadByStep);
      applyPayload(byStep);
      patchDraft({ byStep });
      const canonical = canonicalOnboardingSlug(slug);
      if (canonical !== slug) {
        router.replace(stepHref(canonical));
        return;
      }
      const stepMeta = apiSteps!.find((step) => step.slug === slug);
      const screens = stepMeta ? screensForStep(stepMeta) : [];
      const stepPayload = byStep[slug] ?? {};
      const resumeScreen =
        screens.length > 0
          ? firstIncompleteScreenIndex(screens, stepPayload)
          : typeof draft.screenIndexByStep[slug] === "number"
            ? draft.screenIndexByStep[slug]
            : 0;
      const clampedResume = isReservedSlug(slug)
        ? insightIndexForSlug(slug, draft.screenIndexByStep[slug])
        : resumeScreen;
      setScreenIndex(clampedResume);
      patchDraft({ stepSlug: slug, screenIndex: clampedResume });

      if (isReservedSlug(slug)) {
        if (flowCache.insight && flowCache.insight.insight_ready !== false) {
          applyInsight(flowCache.insight);
          setInsightStatus("ready");
          return;
        }
        setInsightStatus("loading");
        try {
          const data = await fetchOnboardingInsightReady(token!);
          applyInsight(data);
          setInsightStatus("ready");
          patchDraft({ insightReady: true });
        } catch {
          setInsightStatus("missing");
        }
        return;
      }

      setInsightStatus("idle");
      const known = apiSteps!.some((step) => step.slug === slug);
      if (!known) {
        const first = apiSteps![0];
        router.replace(first ? stepHref(first.slug) : "/");
      }

      // Фоновый refresh сессии без сброса UI (только если уже были в кэше).
      if (hasCache && token) {
        void fetchOnboardingSession(token)
          .then((session) => {
            const next = { ...flowCache.payloadByStep };
            for (const answer of session.answers) {
              const payload =
                answer.payload && typeof answer.payload === "object"
                  ? (answer.payload as Record<string, unknown>)
                  : {};
              next[answer.step_slug] = { ...(next[answer.step_slug] ?? {}), ...payload };
            }
            applyPayload(next);
          })
          .catch(() => {
            /* ignore soft refresh errors */
          });
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Не удалось загрузить онбординг");
    }
  }, [applyInsight, applyPayload, applySteps, applyToken, router, slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (forceNew) {
        resetOnboardingFlowCache();
        clearOnboardingClientState();
        applyPayload({});
        applyInsight(null);
        setInsightStatus("idle");
        setError("");
        // Показать первый шаг сразу, если каталог уже в кэше (прогрев с лендинга).
        if (flowCache.steps) {
          setSteps(flowCache.steps);
        }
        try {
          const [session, fetchedSteps] = await Promise.all([
            startFreshOnboardingSession(),
            flowCache.steps ? Promise.resolve(flowCache.steps) : fetchOnboardingSteps(),
          ]);
          if (cancelled) return;
          applySteps(fetchedSteps);
          applyToken(session.token);
          router.replace(stepHref(slug));
        } catch (err) {
          if (!cancelled) {
            setLoadError(err instanceof Error ? err.message : "Не удалось начать онбординг");
          }
          return;
        }
      }
      if (!cancelled) {
        await warm();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    applyInsight,
    applyPayload,
    applySteps,
    applyToken,
    forceNew,
    router,
    slug,
    warm,
  ]);

  useEffect(() => {
    if (oauthError) {
      setError("Не получилось войти через Яндекс ID. Попробуй ещё раз.");
      setOauthBusy(false);
    }
  }, [oauthError]);

  useEffect(() => {
    if (user?.email) setAuthedEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!authReady || !hasPaidReport || showPaidMapCta) return;
    if (oauthCode || oauthError || oauthBusy) return;
    if (typeof window !== "undefined") {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (hash.get("auth")) return;
    }
    router.replace("/account/");
  }, [
    authReady,
    hasPaidReport,
    oauthBusy,
    oauthCode,
    oauthError,
    router,
    showPaidMapCta,
  ]);

  useEffect(() => {
    const fromHash = readYandexHash();
    if (!fromHash.auth || oauthHandledRef.current) return;
    oauthHandledRef.current = true;
    writeAuthToken(fromHash.auth);
    if (fromHash.sessionToken) applyToken(fromHash.sessionToken);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setOauthBusy(true);
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        const email = me.email || "";
        setAuthedEmail(email);
        void refreshAuth();
        if (fromHash.sessionToken && steps) {
          const session = await fetchOnboardingSession(fromHash.sessionToken);
          if (cancelled) return;
          const next = { ...flowCache.payloadByStep };
          for (const answer of session.answers) {
            const payload =
              answer.payload && typeof answer.payload === "object"
                ? (answer.payload as Record<string, unknown>)
                : {};
            next[answer.step_slug] = { ...(next[answer.step_slug] ?? {}), ...payload };
          }
          const withEmail = withAuthedEmail(steps, next, email);
          applyPayload(withEmail);
          patchDraft({ byStep: withEmail });
        }
        const dest = destinationAfterYandexLogin(Boolean(me.has_paid_report));
        if (!dest) {
          setShowPaidMapCta(true);
          setOauthBusy(false);
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
        router.replace(dest);
      } catch {
        oauthHandledRef.current = false;
        if (!cancelled) {
          setError("Не удалось войти через Яндекс ID");
          setOauthBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPayload, applyToken, refreshAuth, router, steps]);

  useEffect(() => {
    if (!oauthCode || !oauthState || !sessionToken || !steps) return;
    const waitlist = waitlistStepOf(steps);
    if (!waitlist || slug !== waitlist.slug) return;
    if (oauthHandledRef.current) return;
    oauthHandledRef.current = true;
    let cancelled = false;
    setOauthBusy(true);
    setError("");
    (async () => {
      try {
        const result = await completeYandexAuth(oauthCode, oauthState);
        if (cancelled) return;
        writeAuthToken(result.token);
        const email = result.user.email || "";
        setAuthedEmail(email);
        applyToken(result.session_token);
        const session = await fetchOnboardingSession(result.session_token);
        const next = { ...flowCache.payloadByStep };
        for (const answer of session.answers) {
          const payload =
            answer.payload && typeof answer.payload === "object"
              ? (answer.payload as Record<string, unknown>)
              : {};
          next[answer.step_slug] = { ...(next[answer.step_slug] ?? {}), ...payload };
        }
        const withEmail = withAuthedEmail(steps, next, email);
        applyPayload(withEmail);
        patchDraft({ byStep: withEmail });
        void refreshAuth();
        const dest = destinationAfterYandexLogin(Boolean(result.user.has_paid_report));
        if (!dest) {
          setShowPaidMapCta(true);
          setOauthBusy(false);
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
        router.replace(dest);
      } catch (err) {
        oauthHandledRef.current = false;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Не удалось войти через Яндекс ID");
          setOauthBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    applyPayload,
    applyToken,
    oauthCode,
    oauthState,
    refreshAuth,
    router,
    sessionToken,
    slug,
    steps,
  ]);

  useEffect(() => {
    const canonical = canonicalOnboardingSlug(slug);
    if (canonical !== slug) {
      router.replace(stepHref(canonical));
      return;
    }
    const draft = readDraft();
    const saved = draft.screenIndexByStep[slug];
    if (isReservedSlug(slug)) {
      const nextIndex = insightIndexForSlug(slug, saved);
      setScreenIndex(nextIndex);
      patchDraft({ stepSlug: slug, screenIndex: nextIndex });
      setError("");
      return;
    }
    const raw = typeof saved === "number" ? saved : 0;
    setScreenIndex(Math.min(Math.max(0, raw), Number.POSITIVE_INFINITY));
    setError("");
  }, [router, slug]);

  useEffect(() => {
    if (!isReservedSlug(slug) || !steps || insightStatus !== "missing") return;
    const birth = birthStepOf(steps);
    setInsightStatus("idle");
    // Без карты на сессии разбор не собрать. Не возвращаем на contacts —
    // иначе «Показать результат» крутит contacts ↔ insight.
    router.replace(birth ? stepHref(birth.slug) : stepHref(steps[0]?.slug ?? "welcome"));
  }, [slug, steps, insightStatus, router]);

  function updateStepPayload(stepSlug: string, patch: Record<string, unknown>) {
    setPayloadByStep((prev) => {
      const next = {
        ...prev,
        [stepSlug]: { ...(prev[stepSlug] ?? {}), ...patch },
      };
      flowCache.payloadByStep = next;
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
      if (screenIndex >= INSIGHT_CONFIRM_INDEX) {
        setScreen(INSIGHT_OFFER_INDEX);
        return;
      }
      const current = insightScreenForSlug(slug);
      if (current > 0) {
        void goTo(insightHrefForScreen(current - 1));
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

  async function startYandexLogin() {
    if (!currentStep || currentStep.step_type !== "waitlist" || submitting) return;
    const contacts = contactsFromPayload(payloadByStep[currentStep.slug]);
    if (!contacts.pd_consent) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      clearAuthNext();
      const token = await persistStep(
        currentStep.slug,
        {
          ...payloadByStep[currentStep.slug],
          pd_consent: true,
          pd_consent_at: new Date().toISOString(),
        },
        false,
      );
      const redirectUri = `${window.location.origin}${window.location.pathname.replace(/\/+$/, "")}`;
      const { url } = await startYandexAuth(token, redirectUri);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось начать вход через Яндекс ID");
      setSubmitting(false);
    }
  }

  async function completeCurrentStep(payload: Record<string, unknown>) {
    if (!currentStep || !steps) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await persistStep(currentStep.slug, payload, true);

      if (currentStep.step_type === "birth_data") {
        // Натал уже в PUT birth. LLM стартует на сервере — не кэшируем черновик шаблонов.
        void fetchOnboardingInsight(token)
          .then((data) => {
            if (data.insight_ready === false) return;
            flowCache.insight = data;
            setInsight(data);
            patchDraft({ insightReady: true });
          })
          .catch(() => {
            // Подтянем на contacts / insight.
          });
      }

      if (currentStep.step_type === "waitlist") {
        const birth = birthStepOf(steps);
        const natalPayload = birth ? persistableBirthPayload(payloadByStep, birth.slug) : null;
        if (!natalPayload || !birth) {
          setError("Сначала укажи дату и город рождения");
          if (birth) await goTo(stepHref(birth.slug));
          return;
        }
        // Сессия могла сброситься (рестарт API / новый token) — дописываем карту из черновика.
        await persistStep(birth.slug, natalPayload, true);

        // Не ждём LLM на кнопке «Открываем…» — сразу на /insight, там глаз-прелоадер.
        void fetchOnboardingInsight(token)
          .then((data) => {
            if (data.insight_ready === false) return;
            flowCache.insight = data;
            setInsight(data);
            patchDraft({ insightReady: true });
          })
          .catch(() => {
            /* warm() на insight-странице повторит запрос */
          });
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
      const payload: Record<string, unknown> = {
        ...(payloadByStep[currentStep.slug] ?? {}),
        _screen:
          contentScreens.length > 0
            ? contentScreens[screenIndex]?.id ?? screenIndex
            : "acknowledge",
      };
      if (contentScreens.length > 0) {
        const screen = contentScreens[screenIndex];
        if (screen.kind === "text" && screen.field === "name") {
          payload.name = sanitizePersonName(String(payload.name || ""));
          updateStepPayload(currentStep.slug, { name: payload.name });
        }
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
      const email = (contacts.email || authedEmail).trim();
      const alreadyIn = Boolean(authedEmail || readAuthToken());
      if (!contacts.pd_consent) {
        setError("Нужно согласие на обработку персональных данных");
        return;
      }
      if (alreadyIn) {
        if (hasPaidReport || showPaidMapCta) {
          router.replace("/account/");
          return;
        }
        if (!isValidEmail(email)) {
          setError(CONTACTS_SUPPORT);
          return;
        }
        await completeCurrentStep(
          buildWaitlistPayload(steps ?? [], payloadByStep, { ...contacts, email, pd_consent: true }),
        );
        return;
      }
      await startYandexLogin();
    }
  }

  async function startCheckout() {
    if (submitting) return;

    const waitlist = waitlistStepOf(steps);
    const contacts = contactsFromPayload(
      waitlist ? payloadByStep[waitlist.slug] : undefined,
    );
    if (!contactsAreValid(contacts)) {
      setError(CONTACTS_SUPPORT);
      return;
    }
    if (!contacts.offer_consent) {
      setError("Нужно принять публичную оферту");
      return;
    }
    if (!contacts.pd_consent) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }

    // На десктопе вкладку открываем сразу по клику — после await браузер режет popup.
    // На телефоне window.open("about:blank") подменяет текущую вкладку, и Cosmirror умирает.
    const payWindow = openPayWindow();
    setSubmitting(true);
    setError("");
    try {
      if (waitlist && steps) {
        await persistStep(waitlist.slug, buildWaitlistPayload(steps, payloadByStep, contacts), true);
      }
      const token = sessionToken ?? (await ensureSessionToken());
      setSessionToken(token);
      let key = getOrderIdempotencyKey(token);
      let order = await createOrder(token, key);
      writeLastOrderId(order.id);
      if (order.status === "paid") {
        captureEvent("checkout_started", {
          order_id: order.id,
          order_status: order.status,
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

  const payload = currentStep ? (payloadByStep[currentStep.slug] ?? {}) : {};
  const ready = (() => {
    if (!currentStep || submitting || !sessionToken) return false;
    if (currentStep.step_type === "birth_data") {
      const birth = birthFromPayload(payload);
      return (
        Boolean(toIsoDate(birth.birth_date)) &&
        birth.birth_place.trim().length >= 2
      );
    }
    if (currentStep.step_type === "waitlist") {
      const contacts = contactsFromPayload(payload);
      const email = (contacts.email || authedEmail).trim();
      const alreadyIn = Boolean(authedEmail || readAuthToken());
      if (alreadyIn) {
        return Boolean(email) && contacts.pd_consent;
      }
      return contacts.pd_consent;
    }
    if (contentScreens.length > 0) {
      return screenIsComplete(contentScreens[screenIndex], payload);
    }
    return true;
  })();

  const insightLoading = isReservedSlug(slug) && !insight;
  const yandexLoading = Boolean(oauthBusy && currentStep?.step_type === "waitlist");
  // Прелоадер «сверяемся со звёздами» — только на экране разбора, не на шаге birth.
  const mapLoading = insightLoading || yandexLoading;
  const waitlistStep = waitlistStepOf(steps);
  const waitlistContacts = {
    ...contactsFromPayload(waitlistStep ? payloadByStep[waitlistStep.slug] : undefined),
  };
  if (authedEmail && !waitlistContacts.email) {
    waitlistContacts.email = authedEmail;
  }
  const signedIn = Boolean(user || authedEmail || readAuthToken());
  const hasPaidMap = hasPaidReport || showPaidMapCta;
  const homeHref = signedIn ? "/account/" : "/";
  const isInsightConfirm = slug === REPORT_SLUG && screenIndex >= INSIGHT_CONFIRM_INDEX;
  const confirmReady =
    contactsAreValid(waitlistContacts) &&
    waitlistContacts.pd_consent &&
    waitlistContacts.offer_consent;
  const showProgress =
    !mapLoading && (Boolean(currentStep) || (isReservedSlug(slug) && Boolean(insight)));
  const isFirstScreen =
    Boolean(currentStep) &&
    !prevStepHref(steps ?? [], slug) &&
    screenIndex === 0;

  if (loadError) {
    return (
      <main className="relative flex h-[100dvh] flex-1 items-center justify-center bg-[#050d4a] px-5 text-center text-white">
        <div>
          <p className="text-white/70">{loadError}</p>
          <button
            type="button"
            className="mt-6 rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk font-medium text-[#0a1a3a] hover:bg-[#f0dc82]"
            onClick={() => void warm()}
          >
            Повторить
          </button>
        </div>
      </main>
    );
  }

  if (!steps) {
    return <StarCheckPreloaderPage />;
  }

  return (
    <main className="relative flex h-[100dvh] flex-1 flex-col overflow-hidden">
      <Image
        src="/images/hero-coastal-moon-trail_4.webp"
        alt=""
        fill
        priority
        className="object-cover object-[center_68%]"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050d4a]/85 via-[#050d4a]/55 to-[#050d4a]/75"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050d4a]/90"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:px-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between">
          {insightLoading ? (
            <span className="w-11" aria-hidden />
          ) : isFirstScreen && !isReservedSlug(slug) ? (
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

          {insightLoading ? (
            <span className="text-xl font-medium">
              <CosmirrorMark />
            </span>
          ) : (
            <Link
              href={homeHref}
              className="text-xl font-medium transition hover:opacity-90"
            >
              <CosmirrorMark />
            </Link>
          )}

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
                      ? "w-7 bg-[#F6E7A1]"
                      : done
                        ? "w-4 bg-[#F6E7A1]/55"
                        : "w-4 bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        ) : null}

        {mapLoading ? (
          <StarCheckPreloader />
        ) : isReservedSlug(slug) && insight ? (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (isInsightConfirm) {
                if (!confirmReady || submitting) return;
                void startCheckout();
                return;
              }
              if (screenIndex >= INSIGHT_OFFER_INDEX) {
                setScreen(INSIGHT_CONFIRM_INDEX);
                return;
              }
              void goTo(insightHrefForScreen(screenIndex + 1));
            }}
            className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-2 md:pt-4"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
              {isInsightConfirm ? (
                <ConfirmContactsStep
                  value={waitlistContacts}
                  onChange={(next) => {
                    if (!waitlistStep) return;
                    setError("");
                    updateStepPayload(waitlistStep.slug, next);
                  }}
                  error={error}
                  submitting={submitting}
                  emailFromYandex={Boolean(authedEmail)}
                />
              ) : insight ? (
                <InsightFunnel
                  screenIndex={screenIndex}
                  insight={insight}
                  steps={steps}
                  payloadByStep={payloadByStep}
                />
              ) : null}
            </div>
            <div className="shrink-0 pt-3">
              {error &&
              !(
                isInsightConfirm &&
                (error === CONTACTS_SUPPORT ||
                  error.toLowerCase().includes("telegram") ||
                  error.toLowerCase().includes("email") ||
                  error.toLowerCase().includes("реальн"))
              ) ? (
                <p
                  className={`mb-2 text-sm ${
                    error.toLowerCase().includes("оферт") || error.toLowerCase().includes("соглас")
                      ? "text-[#F6E7A1]"
                      : "text-red-300"
                  }`}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              {screenIndex >= INSIGHT_SCREEN_COUNT - 1 ? (
                <button
                  type="submit"
                  disabled={submitting || !sessionToken || !confirmReady}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:scale-100 disabled:hover:bg-white/12 md:text-xl"
                >
                  {submitting ? "Открываем оплату…" : insightCtaLabel(screenIndex, insight)}
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
                >
                  {insightCtaLabel(screenIndex, insight)}
                </button>
              )}
            </div>
          </form>
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
                signedIn={signedIn}
                authedEmail={authedEmail}
                hasPaidMap={hasPaidMap}
                yandexReady={ready}
                onYandex={() => void startYandexLogin()}
                onPayload={(patch) => {
                  setError("");
                  updateStepPayload(currentStep.slug, patch);
                }}
              />
            </div>

            {error &&
            !(
              currentStep?.step_type === "waitlist" &&
              (error === CONTACTS_SUPPORT ||
                error.toLowerCase().includes("реальн") ||
                error.toLowerCase().includes("telegram") ||
                error.toLowerCase().includes("email"))
            ) ? (
              <p
                className={`mb-2 shrink-0 text-sm ${
                  error.toLowerCase().includes("соглас") ? "text-[#F6E7A1]" : "text-red-300"
                }`}
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="shrink-0 pt-3">
              {currentStep.step_type === "waitlist" && (!signedIn || hasPaidMap) ? null : (
                <button
                  type="submit"
                  disabled={!ready}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:scale-100 disabled:hover:bg-white/12 md:text-xl"
                >
                  {ctaLabel(currentStep, submitting)}
                </button>
              )}
            </div>
          </form>
        ) : (
          <StarCheckPreloader />
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
  signedIn,
  authedEmail,
  hasPaidMap,
  yandexReady,
  onYandex,
  onPayload,
}: {
  step: OnboardingStep;
  screens: ContentScreen[];
  screenIndex: number;
  payload: Record<string, unknown>;
  error: string;
  submitting: boolean;
  signedIn: boolean;
  authedEmail: string;
  hasPaidMap: boolean;
  yandexReady: boolean;
  onYandex: () => void;
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
        error={error}
        submitting={submitting}
        signedIn={signedIn}
        authedEmail={authedEmail}
        hasPaidMap={hasPaidMap}
        yandexReady={yandexReady}
        onYandex={onYandex}
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
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {step.title}
      </h1>
      {step.subtitle ? (
        <p className="mt-3 text-sm font-normal leading-relaxed text-white/80">{step.subtitle}</p>
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
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
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
          spellCheck={screen.field === "name" ? false : undefined}
          autoCorrect={screen.field === "name" ? "off" : undefined}
          autoCapitalize={screen.field === "name" ? "words" : undefined}
          maxLength={screen.field === "name" ? 40 : undefined}
          onChange={(event) =>
            onPayload({
              [screen.field]:
                screen.field === "name"
                  ? sanitizePersonNameInput(event.target.value)
                  : event.target.value,
            })
          }
          className="mt-10 w-full border-b border-white/20 bg-transparent pb-3 text-2xl text-white outline-none placeholder:text-white/30 focus:border-[#F6E7A1] sm:text-3xl"
        />
      </div>
    );
  }

  if (screen.kind === "single") {
    const value = typeof payload[screen.field] === "string" ? (payload[screen.field] as string) : "";
    return (
      <div className="flex flex-col">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
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
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {renderTitle(screen.title)}
      </h1>
      {screen.hint ? (
        <p className="mt-3 text-sm font-normal text-white/80">{screen.hint}</p>
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
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя <span className="font-display italic text-[#F6E7A1]">натальная карта</span>
      </h1>
      <p className="mt-3 text-sm font-normal leading-relaxed text-white/80">
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
            className={`${fieldClass()} ${dateInvalid ? "!border-[#F6E7A1]" : ""}`}
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
            className={`${fieldClass()} ${placeInvalid ? "!border-[#F6E7A1]" : ""}`}
          />
          {suggestLoading ? (
            <p className="mt-2 text-xs font-normal text-white/50">Ищем города…</p>
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
              className="mt-0.5 h-4 w-4 accent-[#F6E7A1]"
            />
            <span>Не знаю точное время рождения</span>
          </label>
          {value.unknown_time ? (
            <p className="mt-2 text-xs font-normal text-white/50">
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
  error,
  submitting,
  signedIn,
  authedEmail,
  hasPaidMap = false,
  yandexReady,
  onYandex,
}: {
  value: ContactsAnswers;
  onChange: (value: ContactsAnswers) => void;
  error: string;
  submitting: boolean;
  signedIn: boolean;
  authedEmail: string;
  hasPaidMap?: boolean;
  yandexReady: boolean;
  onYandex: () => void;
}) {
  const email = value.email || authedEmail;
  const showConsentError =
    Boolean(error) &&
    (error.toLowerCase().includes("соглас") || error.toLowerCase().includes("яндекс"));

  if (hasPaidMap) {
    return (
      <div className="flex flex-col">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
          Твоя карта <span className="font-display italic text-[#F6E7A1]">уже здесь</span>
        </h1>
        <p className="mt-5 text-base font-normal leading-relaxed text-white/75 sm:text-lg">
          Вошли как {email || "Яндекс ID"}. Открой персональный разбор в кабинете.
        </p>
        <Link
          href="/account/"
          className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98]"
        >
          Открыть мою карту
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя карта <span className="font-display italic text-[#F6E7A1]">готова</span>
      </h1>
      <p className="mt-5 text-base font-normal leading-relaxed text-white/75 sm:text-lg">
        {signedIn
          ? `Вошли как ${email || "Яндекс ID"}. Откроем персональный разбор.`
          : "Войди через Яндекс ID — откроем персональный разбор и сохраним его в твоём кабинете."}
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <PdConsentCheckbox
          id="contact-pd-consent"
          checked={value.pd_consent}
          disabled={submitting}
          onChange={(checked) => onChange({ ...value, pd_consent: checked })}
          includeTerms
        />

        {showConsentError ? (
          <p className="-mt-4 text-sm font-normal text-[#F6E7A1]/90" role="status">
            {error}
          </p>
        ) : null}

        {signedIn ? null : (
          <button
            type="button"
            disabled={submitting || !yandexReady}
            onClick={onYandex}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-black px-8 py-3 font-grotesk text-lg font-medium text-white transition-all hover:scale-[1.02] hover:bg-black/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:scale-100 disabled:hover:bg-white/12"
          >
            <YandexMark />
            {submitting ? "Открываем Яндекс…" : "Войти через Яндекс ID"}
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmContactsStep({
  value,
  onChange,
  error,
  submitting,
  emailFromYandex = false,
}: {
  value: ContactsAnswers;
  onChange: (value: ContactsAnswers) => void;
  error: string;
  submitting: boolean;
  emailFromYandex?: boolean;
}) {
  const telegramInvalid =
    Boolean(value.telegram.trim()) && !isValidTelegram(value.telegram);
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
    <div className="reveal flex flex-col pt-2 md:pt-4">
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Проверь <span className="font-display italic text-[#F6E7A1]">почту</span>
      </h1>
      <p className="mt-4 text-base font-normal leading-relaxed text-white/75 sm:text-lg">
        {emailFromYandex
          ? "Почту взяли из Яндекс ID. Осталось указать Telegram — туда пришлём доступ к разбору."
          : "Сюда придёт PDF-разбор. Если опечатка — поправь сейчас, после оплаты письмо уйдёт на этот адрес."}
      </p>

      <div className="mt-7 flex flex-col gap-6">
        <div>
          <label htmlFor="confirm-email" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Email
          </label>
          <input
            id="confirm-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            disabled={submitting}
            placeholder="you@example.com"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            aria-invalid={emailInvalid || undefined}
            className={`${fieldClass()} ${emailInvalid ? "!border-[#F6E7A1]" : ""}`}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-telegram"
            className="text-xs uppercase tracking-[0.16em] text-white/40"
          >
            Telegram
          </label>
          <input
            id="confirm-telegram"
            type="text"
            name="telegram"
            required
            autoFocus
            disabled={submitting}
            placeholder="@username"
            value={value.telegram}
            onChange={(event) => onChange({ ...value, telegram: event.target.value })}
            aria-invalid={telegramInvalid || undefined}
            className={`${fieldClass()} ${telegramInvalid ? "!border-[#F6E7A1]" : ""}`}
          />
        </div>

        {showSupport ? (
          <p className="-mt-2 text-sm font-normal text-[#F6E7A1]/90" role="status">
            {CONTACTS_SUPPORT}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <OfferConsentCheckbox
            id="confirm-offer-consent"
            checked={value.offer_consent}
            disabled={submitting}
            onChange={(checked) => onChange({ ...value, offer_consent: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function OfferConsentCheckbox({
  id,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/65">
      <input
        id={id}
        type="checkbox"
        name="offer_consent"
        required
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
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
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#F6E7A1]"
      />
      <span>
        Соглашаюсь на{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#F6E7A1] underline-offset-2 hover:underline"
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
              className="text-[#F6E7A1] underline-offset-2 hover:underline"
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

function YandexMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#FC3F1D" />
      <path
        d="M13.1 6h-2.2L7.4 18h2.15l.72-2.55h3.5L14.5 18H16.7L13.1 6zm-.55 7.2h-2.1L11.7 8.9h.1l.75 4.3z"
        fill="#fff"
      />
    </svg>
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
