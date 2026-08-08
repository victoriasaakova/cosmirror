const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function parseJson(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

function networkErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TypeError) {
    return "Не удалось связаться с API. Запусти cosmirror-api на http://127.0.0.1:8000";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || !data) return fallback;
  const record = data as Record<string, unknown>;
  for (const key of ["email", "detail", "non_field_errors", "astro", "telegram", "phone"]) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value) && value[0]) return String(value[0]);
  }
  const payload = record.payload;
  if (typeof payload === "object" && payload) {
    const p = payload as Record<string, unknown>;
    for (const key of ["birth_date", "birth_place", "astro", "email", "telegram", "phone"]) {
      const value = p[key];
      if (typeof value === "string" && value) return value;
      if (Array.isArray(value) && value[0]) return String(value[0]);
    }
  }
  return fallback;
}

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

export type OnboardingStep = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  step_type: "content" | "birth_data" | "waitlist" | "input" | "custom" | string;
  order: number;
  is_required: boolean;
  fields_schema: Record<string, unknown>;
  meta: Record<string, unknown>;
  url_path: string;
};

export type OnboardingStepAnswer = {
  id: number;
  step: number;
  step_slug: string;
  step_url: string;
  payload: Record<string, unknown>;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingSession = {
  token: string;
  status: "in_progress" | "completed" | "converted" | string;
  current_step_slug: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string;
  birth_lat: string | null;
  birth_lng: string | null;
  timezone: string;
  answers: OnboardingStepAnswer[];
  next_step: OnboardingStep | null;
  progress: { done: number; total: number };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type GlobalPlanetaryCycle = {
  key: string;
  title: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  cycle_data: Record<string, unknown>;
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

  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось отправить заявку"));
  return data as WaitlistResponse;
}

export async function fetchOnboardingSteps(): Promise<OnboardingStep[]> {
  const res = await fetch(`${API_URL}/api/onboarding/steps/`, { cache: "no-store" });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось загрузить шаги онбординга"));
  return data as OnboardingStep[];
}

export async function createOnboardingSession(): Promise<OnboardingSession> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/onboarding/sessions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err, "Не удалось создать сессию"));
  }
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось создать сессию"));
  return data as OnboardingSession;
}

export async function fetchOnboardingSession(token: string): Promise<OnboardingSession> {
  const res = await fetch(`${API_URL}/api/onboarding/sessions/${token}/`, { cache: "no-store" });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось загрузить сессию"));
  return data as OnboardingSession;
}

export async function submitOnboardingStep(
  token: string,
  slug: string,
  payload: Record<string, unknown>,
  completed = true,
): Promise<OnboardingSession> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/onboarding/sessions/${token}/steps/${slug}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, completed }),
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err, "Не удалось сохранить шаг"));
  }
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось сохранить шаг"));
  return data as OnboardingSession;
}

export async function fetchGlobalCycles(): Promise<GlobalPlanetaryCycle[]> {
  const res = await fetch(`${API_URL}/api/astro/cycles/`, { cache: "no-store" });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось загрузить циклы"));
  return data as GlobalPlanetaryCycle[];
}

export type PlaceSuggestion = {
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
};

export async function lookupPlace(query: string): Promise<PlaceSuggestion> {
  const res = await fetch(`${API_URL}/api/geo/lookup/?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось найти город"));
  return data as PlaceSuggestion;
}

export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const res = await fetch(`${API_URL}/api/geo/suggest/?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось найти города"));
  const record = data as { results?: PlaceSuggestion[] };
  return Array.isArray(record.results) ? record.results : [];
}

export type OnboardingInsight = {
  status: string;
  has_birth_time: boolean;
  natal: {
    planets: Record<string, { sign: string; sign_ru: string; degree: number; longitude?: number }>;
    ascendant: { sign: string; sign_ru: string; degree: number } | null;
    midheaven: { sign: string; sign_ru: string; degree: number } | null;
    houses: unknown;
    notes: string[];
    location: { place: string; lat: number; lng: number };
    timezone: string;
    engine: string;
  };
  insight: {
    tone: string;
    disclaimer: string;
    base: { key: string; title: string; text: string }[];
    cycles: { key: string; title: string; text: string }[];
    influences: { key: string; title: string; text: string }[];
    opening?: { bridge: string; insight: string };
    body?: string;
    sky_now: Record<string, unknown>;
    cycle_pitches?: { cycle_key: string; title: string; text: string }[];
    outcomes?: { title: string; items: string[] };
    offer?: { title: string; text: string; cta: string; price?: string };
    source?: "polza" | "groq" | "templates" | string;
  };
};

export async function fetchOnboardingInsight(token: string): Promise<OnboardingInsight> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/onboarding/sessions/${token}/insight/`, {
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(networkErrorMessage(err, "Не удалось получить инсайт"));
  }
  const data = await parseJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Не удалось получить инсайт"));
  return data as OnboardingInsight;
}

export { API_URL };
