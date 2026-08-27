import type { AuthUser } from "@/lib/api";

export function userDisplayName(user: AuthUser | null): string {
  if (!user) return "Профиль";
  const fromProfile = user.profile?.display_name?.trim();
  if (fromProfile) return fromProfile;
  const first = user.first_name?.trim();
  if (first) return first;
  const emailName = user.email?.split("@")[0]?.trim();
  return emailName || "Профиль";
}

export function greetingName(user: AuthUser | null): string {
  const raw = userDisplayName(user);
  if (!raw || raw === "Профиль") return "";
  return raw.charAt(0).toLocaleUpperCase("ru-RU") + raw.slice(1);
}
