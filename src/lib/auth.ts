export const AUTH_TOKEN_KEY = "cosmirror.auth.token";
export const AUTH_NEXT_KEY = "cosmirror.auth.next";
export const AUTH_EVENT = "cosmirror-auth";

export function readAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function writeAuthToken(token: string) {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyAuthChanged();
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthChanged();
}

export function isLoggedIn(): boolean {
  return Boolean(readAuthToken());
}

export function rememberAuthNext(path: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_NEXT_KEY, path);
}

export function consumeAuthNext(): string {
  if (typeof window === "undefined") return "";
  const next = sessionStorage.getItem(AUTH_NEXT_KEY) || "";
  sessionStorage.removeItem(AUTH_NEXT_KEY);
  return next;
}

export function clearAuthNext() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_NEXT_KEY);
}
