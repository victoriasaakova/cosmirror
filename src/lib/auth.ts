export const AUTH_TOKEN_KEY = "cosmirror.auth.token";

export function readAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function writeAuthToken(token: string) {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(readAuthToken());
}
