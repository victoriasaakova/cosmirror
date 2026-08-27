import type { AuthUser } from "@/lib/api";

function looksLikeAccountHandle(value: string, user: AuthUser | null): boolean {
  const raw = value.trim();
  if (!raw) return true;
  if (raw.includes("@")) return true;
  const lowered = raw.toLowerCase();
  const local = user?.email?.split("@")[0]?.trim().toLowerCase() || "";
  if (local && lowered === local) return true;
  const username = user?.username?.trim().toLowerCase() || "";
  if (username && lowered === username) return true;
  const hasCyrillic = /[а-яё]/i.test(raw);
  if (!raw.includes(" ") && raw.includes(".") && !hasCyrillic) return true;
  return false;
}

function firstHumanName(user: AuthUser | null): string {
  if (!user) return "";
  const candidates = [user.display_name, user.profile?.display_name, user.first_name];
  for (const candidate of candidates) {
    const value = candidate?.trim() || "";
    if (value && !looksLikeAccountHandle(value, user)) return value;
  }
  return "";
}

/** Header brand. Empty → Cosmirror mark text, never a Yandex login or email. */
export function userDisplayName(user: AuthUser | null): string {
  return firstHumanName(user);
}

export function greetingName(user: AuthUser | null): string {
  const raw = firstHumanName(user);
  if (!raw) return "";
  return raw.charAt(0).toLocaleUpperCase("ru-RU") + raw.slice(1);
}
