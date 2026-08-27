import { startYandexAuth } from "@/lib/api";
import { consumeAuthNext, rememberAuthNext } from "@/lib/auth";
import { ensureSessionToken } from "@/lib/onboarding/session";

export async function beginYandexLogin(nextPath = "/account/") {
  rememberAuthNext(nextPath);
  const token = await ensureSessionToken();
  const redirectUri = `${window.location.origin}/onboarding/contacts`;
  const { url } = await startYandexAuth(token, redirectUri);
  window.location.assign(url);
}

/** After Yandex returns to /onboarding/contacts. `null` = stay and show «Открыть мою карту». */
export function destinationAfterYandexLogin(hasPaidReport: boolean): string | null {
  const next = consumeAuthNext().trim();
  if (next.startsWith("/account")) return "/account/";
  if (hasPaidReport) return null;
  return "/onboarding/insight/";
}
