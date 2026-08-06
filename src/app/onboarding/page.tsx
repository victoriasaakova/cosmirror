"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOnboardingSteps } from "@/lib/api";
import { resumeHref } from "@/lib/onboarding/screens";
import { loadOrCreateSession } from "@/lib/onboarding/session";

/** `/onboarding` → first / next step from API session. */
export default function OnboardingIndexPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [steps, session] = await Promise.all([
          fetchOnboardingSteps(),
          loadOrCreateSession(),
        ]);
        if (cancelled) return;
        router.replace(resumeHref(steps, session.next_step, session.status));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Не удалось открыть онбординг");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#07070c] px-5 text-center text-white">
        <div>
          <p className="text-white/70">{error}</p>
          <a href="/" className="mt-6 inline-block text-[#ff7b36]">
            На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#07070c] text-white/50">
      Загружаем…
    </div>
  );
}
