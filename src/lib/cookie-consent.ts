export const COOKIE_CONSENT_KEY = "cosmirror.cookie-consent.v1";

export type CookieConsentChoice = "all" | "necessary";

export type CookieConsentRecord = {
  choice: CookieConsentChoice;
  at: string;
};

/** Client snapshot is a saved choice or null. "ssr" is only used during SSR/hydration. */
export type CookieConsentSnapshot = CookieConsentChoice | null | "ssr";

const listeners = new Set<() => void>();
let memoryConsent: CookieConsentRecord | null = null;

function isChoice(value: unknown): value is CookieConsentChoice {
  return value === "all" || value === "necessary";
}

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
        if (isChoice(parsed.choice) && typeof parsed.at === "string") {
          memoryConsent = { choice: parsed.choice, at: parsed.at };
          return memoryConsent;
        }
      }
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  return memoryConsent;
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentRecord {
  const record: CookieConsentRecord = { choice, at: new Date().toISOString() };
  memoryConsent = record;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
  } catch {
    // Private mode or blocked storage: keep the choice for this session only.
  }
  listeners.forEach((listener) => listener());
  return record;
}

export function subscribeCookieConsent(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = () => {
    memoryConsent = null;
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getCookieConsentSnapshot(): CookieConsentSnapshot {
  return readCookieConsent()?.choice ?? null;
}

export function getCookieConsentServerSnapshot(): CookieConsentSnapshot {
  return "ssr";
}
