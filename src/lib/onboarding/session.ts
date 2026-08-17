import {
  createOnboardingSession,
  fetchOnboardingSession,
  type OnboardingSession,
} from "@/lib/api";

export const SESSION_KEY = "cosmirror.onboarding.token";
export const DRAFT_KEY = "cosmirror.onboarding.draft";
export const LAST_ORDER_KEY = "cosmirror.lastOrderId";
const ORDER_IDEM_PREFIX = "cosmirror.order.idempotency.";

export type OnboardingDraft = {
  /** Answers keyed by API step slug */
  byStep: Record<string, Record<string, unknown>>;
  /** Internal screen index for multi-screen content steps */
  screenIndexByStep: Record<string, number>;
  insightReady?: boolean;
};

export function readDraft(): OnboardingDraft {
  if (typeof window === "undefined") {
    return { byStep: {}, screenIndexByStep: {} };
  }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { byStep: {}, screenIndexByStep: {} };
    const parsed = JSON.parse(raw) as OnboardingDraft;
    return {
      byStep: parsed.byStep ?? {},
      screenIndexByStep: parsed.screenIndexByStep ?? {},
      insightReady: parsed.insightReady,
    };
  } catch {
    return { byStep: {}, screenIndexByStep: {} };
  }
}

export function writeDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function patchDraft(patch: Partial<OnboardingDraft> & {
  stepSlug?: string;
  payload?: Record<string, unknown>;
  screenIndex?: number;
}) {
  const current = readDraft();
  const next: OnboardingDraft = {
    byStep: { ...current.byStep },
    screenIndexByStep: { ...current.screenIndexByStep },
    insightReady: patch.insightReady ?? current.insightReady,
  };
  if (patch.stepSlug && patch.payload) {
    next.byStep[patch.stepSlug] = {
      ...(next.byStep[patch.stepSlug] ?? {}),
      ...patch.payload,
    };
  }
  if (patch.stepSlug && typeof patch.screenIndex === "number") {
    next.screenIndexByStep[patch.stepSlug] = patch.screenIndex;
  }
  if (patch.byStep) next.byStep = { ...next.byStep, ...patch.byStep };
  if (patch.screenIndexByStep) {
    next.screenIndexByStep = { ...next.screenIndexByStep, ...patch.screenIndexByStep };
  }
  writeDraft(next);
  return next;
}

export async function ensureSessionToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      try {
        await fetchOnboardingSession(existing);
        return existing;
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }
  const session = await createOnboardingSession();
  localStorage.setItem(SESSION_KEY, session.token);
  return session.token;
}

/** Сброс клиентского состояния онбординга (токен + черновик). */
export function clearOnboardingClientState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LAST_ORDER_KEY);
  sessionStorage.removeItem(DRAFT_KEY);
  const prefix = ORDER_IDEM_PREFIX;
  const toRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(prefix)) toRemove.push(key);
  }
  toRemove.forEach((key) => sessionStorage.removeItem(key));
}

/** Новая серверная сессия с чистым клиентским стейтом. */
export async function startFreshOnboardingSession(): Promise<OnboardingSession> {
  clearOnboardingClientState();
  const session = await createOnboardingSession();
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, session.token);
  }
  return session;
}

export async function loadOrCreateSession(): Promise<OnboardingSession> {
  const token = await ensureSessionToken();
  return fetchOnboardingSession(token);
}

export function getOrderIdempotencyKey(sessionToken: string): string {
  const storageKey = ORDER_IDEM_PREFIX + sessionToken;
  if (typeof window === "undefined") return crypto.randomUUID();
  let key = sessionStorage.getItem(storageKey);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, key);
  }
  return key;
}

export function rotateOrderIdempotencyKey(sessionToken: string): string {
  const storageKey = ORDER_IDEM_PREFIX + sessionToken;
  const key = crypto.randomUUID();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(storageKey, key);
  }
  return key;
}

export function readLastOrderId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_ORDER_KEY) || "";
}

export function writeLastOrderId(orderId: string) {
  if (typeof window === "undefined" || !orderId) return;
  localStorage.setItem(LAST_ORDER_KEY, orderId);
}
