import { consumeAuthNext, rememberAuthNext } from "@/lib/auth";
import { startYandexAuth } from "@/lib/api";
import { ensureSessionToken } from "@/lib/onboarding/session";
import {
  DEFAULT_ONBOARDING_PURCHASE_FLOW,
  isCabinetOnboardingPurchase,
  type OnboardingPurchaseFlow,
} from "@/lib/flags/onboarding-purchase-flow";
import { SITE_URL } from "@/lib/site-meta";

/** Без завершающего слэша — так зарегистрировано в кабинете Яндекс OAuth. */
export const YANDEX_CONTACTS_PATH = "/onboarding/contacts";

export function yandexRedirectUri(): string {
  if (typeof window === "undefined") return `${SITE_URL}${YANDEX_CONTACTS_PATH}`;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.origin}${YANDEX_CONTACTS_PATH}`;
  }
  return `${SITE_URL}${YANDEX_CONTACTS_PATH}`;
}

export async function beginYandexLogin(
  nextPath = "/account/",
  after?: "account" | "insight",
) {
  rememberAuthNext(nextPath);
  const token = await ensureSessionToken();
  const { url } = await startYandexAuth(token, yandexRedirectUri(), after);
  window.location.assign(url);
}

/** After Yandex returns to /onboarding/contacts. `null` = stay and show «Открыть мою карту». */
export function destinationAfterYandexLogin(
  hasPaidReport: boolean,
  flow: OnboardingPurchaseFlow = DEFAULT_ONBOARDING_PURCHASE_FLOW,
): string | null {
  const next = consumeAuthNext().trim();
  if (hasPaidReport) return next.startsWith("/account") ? "/account/" : null;
  if (isCabinetOnboardingPurchase(flow)) return "/account/";
  if (next.startsWith("/account")) return "/account/";
  return "/onboarding/insight/";
}
