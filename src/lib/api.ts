const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type WaitlistPayload = {
  email: string;
  phone?: string;
  telegram?: string;
  name?: string;
  message?: string;
  source?: string;
};

export type WaitlistResponse = {
  id: number;
  email: string;
  phone: string;
  telegram: string;
  name: string;
  source: string;
  message: string;
  created_at: string;
};

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_URL}/api/health/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API health failed: ${res.status}`);
  return res.json();
}

export async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResponse> {
  const res = await fetch(`${API_URL}/api/waitlist/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      phone: payload.phone ?? "",
      telegram: payload.telegram ?? "",
      name: payload.name ?? "",
      message: payload.message ?? "",
      source: payload.source ?? "landing",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "email" in data
        ? String((data as { email: string[] }).email?.[0] ?? "Ошибка")
        : "Не удалось отправить заявку";
    throw new Error(detail);
  }
  return data as WaitlistResponse;
}

export { API_URL };
