"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, logoutOnServer, type AuthUser } from "@/lib/api";
import { AUTH_EVENT, clearAuthToken, isLoggedIn, readAuthToken } from "@/lib/auth";
import { beginYandexLogin } from "@/lib/yandex-login";

type AuthContextValue = {
  ready: boolean;
  user: AuthUser | null;
  hasPaidReport: boolean;
  startLogin: (nextPath?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    if (!readAuthToken()) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      const timedOut =
        err instanceof Error &&
        (err.name === "AbortError" || /abort|timeout|время ожидания/i.test(err.message));
      if (!timedOut) {
        clearAuthToken();
        setUser(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => {
      void refresh();
    };
    window.addEventListener(AUTH_EVENT, onChange);
    return () => window.removeEventListener(AUTH_EVENT, onChange);
  }, [refresh]);

  const startLogin = useCallback(async (nextPath = "/account/") => {
    await beginYandexLogin(
      nextPath,
      nextPath.startsWith("/account") ? "account" : undefined,
    );
  }, []);

  const logout = useCallback(() => {
    void logoutOnServer().finally(() => {
      clearAuthToken();
      setUser(null);
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/account")) {
        window.location.assign("/");
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      hasPaidReport: Boolean(user?.has_paid_report),
      startLogin,
      logout,
      refresh,
    }),
    [logout, ready, refresh, startLogin, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      ready: !isLoggedIn(),
      user: null,
      hasPaidReport: false,
      startLogin: beginYandexLogin,
      logout: clearAuthToken,
      refresh: async () => undefined,
    } satisfies AuthContextValue;
  }
  return ctx;
}
