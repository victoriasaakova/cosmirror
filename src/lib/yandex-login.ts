import { consumeAuthNext, rememberAuthNext } from "@/lib/auth";
import { startYandexAuth } from "@/lib/api";
import { ensureSessionToken } from "@/lib/onboarding/session";
import {
  DEFAULT_ONBOARDING_PURCHASE_FLOW,
  isCabinetOnboardingPurchase,
  type OnboardingPurchaseFlow,
} from "@/lib/flags/onboarding-purchase-flow";

export async function beginYandexLogin(
  nextPath = "/account/",
  after?: "account" | "insight",
) {
  rememberAuthNext(nextPath);
  const token = await ensureSessionToken();
  const redirectUri = `${window.location.origin}/onboarding/contacts`;
  const { url } = await startYandexAuth(token, redirectUri, after);
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
  if (next.startsWith("/account")) return "/";
  return "/onboarding/insight/";
}
