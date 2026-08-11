"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOnboardingSteps } from "@/lib/api";
import { freshOnboardingHref } from "@/lib/onboarding/paths";
import { resumeHref } from "@/lib/onboarding/screens";
import { loadOrCreateSession } from "@/lib/onboarding/session";

function LoadingScreen({ message = "Загружаем…" }: { message?: string }) {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#050d4a] text-white/50">
      {message}
    </div>
  );
}

/** `/onboarding` → resume. `?new=1` сразу уводит на первый шаг. */
function OnboardingIndexInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const [error, setError] = useState("");

  useEffect(() => {
    if (forceNew) {
      router.replace(freshOnboardingHref());
      return;
    }

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

  // new=1: пустой экран на мгновение replace — без «Начинаем сначала…»
  if (forceNew) {
    return <div className="h-[100dvh] bg-[#050d4a]" aria-hidden />;
  }

  return <LoadingScreen message="Загружаем…" />;
}

export default function OnboardingIndexPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-[#050d4a]" aria-hidden />}>
      <OnboardingIndexInner />
    </Suspense>
  );
}
