import type { PaidReport } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const DEV_SHARE_KEY = "cosmirror-dev-share-internal";

function shareInternalKey(): string {
  const fromEnv = (process.env.SHARE_INTERNAL_KEY || "").trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? "" : DEV_SHARE_KEY;
}

export async function loadSharedChart(token: string): Promise<PaidReport | null> {
  const trimmed = token.trim();
  const key = shareInternalKey();
  if (!trimmed || !key) return null;
  try {
    const res = await fetch(`${API_URL}/api/share/${encodeURIComponent(trimmed)}/`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Cosmirror-Share": key,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as PaidReport;
  } catch {
    return null;
  }
}
