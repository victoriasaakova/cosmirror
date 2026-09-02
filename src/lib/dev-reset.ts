import { API_URL } from "@/lib/api";
import { clearAuthToken, readAuthToken, sessionHeaders, writeAuthToken, readDeviceId } from "@/lib/auth";
import {
  clearOnboardingClientState,
  patchDraft,
  writeOnboardingSessionToken,
} from "@/lib/onboarding/session";

export async function resetLocalDevFlow(): Promise<void> {
  const token = readAuthToken();
  if (token) {
    try {
      await fetch(`${API_URL}/api/me/dev-reset/`, {
        method: "POST",
        headers: sessionHeaders(),
      });
    } catch {
      /* API мог быть выключен */
    }
    try {
      await fetch(`${API_URL}/api/auth/logout/`, {
        method: "POST",
        headers: sessionHeaders(),
      });
    } catch {
      /* local clear below */
    }
  }
  clearAuthToken();
  clearOnboardingClientState();
}

async function devLogin(persona: "empty" | "report" | "insight" | "cabinet"): Promise<{
  sessionToken: string;
}> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/dev-login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, device_id: readDeviceId() }),
    });
  } catch {
    throw new Error("API не отвечает на http://127.0.0.1:8000. Запусти Django и нажми ещё раз.");
  }
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    session_token?: string;
    detail?: string;
  };
  if (!res.ok || !data.token) {
    throw new Error(data.detail || "Не получилось войти локально. Запущен ли API?");
  }
  writeAuthToken(data.token);
  return { sessionToken: data.session_token || "" };
}

export async function devLoginCabinet(): Promise<void> {
  await devLogin("cabinet");
}

export async function devLoginEmpty(): Promise<void> {
  await devLogin("empty");
}

export async function devLoginReport(): Promise<void> {
  await devLogin("report");
}

export async function devLoginInsight(): Promise<void> {
  const { sessionToken } = await devLogin("insight");
  if (!sessionToken) {
    throw new Error("API не вернул сессию онбординга");
  }
  writeOnboardingSessionToken(sessionToken);
  patchDraft({ insightReady: true });
}
