"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOnboardingSteps } from "@/lib/api";
import { firstStepHref, resumeHref } from "@/lib/onboarding/screens";
import {
  loadOrCreateSession,
  startFreshOnboardingSession,
} from "@/lib/onboarding/session";
import { resetOnboardingFlowCache } from "@/components/OnboardingFlow";

function LoadingScreen({ message = "Загружаем…" }: { message?: string }) {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#050d4a] text-white/50">
      {message}
    </div>
  );
}

/** `/onboarding` → first / next step from API session.
 *  `?new=1` — всегда новый проход с первого шага (кнопки с лендинга).
 */
function OnboardingIndexInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const steps = await fetchOnboardingSteps();
        const session = forceNew
          ? await startFreshOnboardingSession()
          : await loadOrCreateSession();
        if (cancelled) return;
        if (forceNew) {
          resetOnboardingFlowCache();
          router.replace(firstStepHref(steps));
          return;
        }
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
  }, [router, forceNew]);

  if (error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#050d4a] px-5 text-center text-white">
        <div>
          <p className="text-white/70">{error}</p>
          <a href="/" className="mt-6 inline-block text-[#F6E7A1]">
            На главную
          </a>
        </div>
      </div>
    );
  }

  return <LoadingScreen message={forceNew ? "Начинаем сначала…" : "Загружаем…"} />;
}

export default function OnboardingIndexPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OnboardingIndexInner />
    </Suspense>
  );
}
