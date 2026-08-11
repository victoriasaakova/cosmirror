"use client";

import { useEffect } from "react";
import { fetchOnboardingSteps } from "@/lib/api";
import { primeOnboardingSteps } from "@/components/OnboardingFlow";

/** Греет каталог шагов, пока пользователь на лендинге — CTA открывает квиз без «Загружаем…». */
export function PrefetchOnboarding() {
  useEffect(() => {
    let cancelled = false;
    void fetchOnboardingSteps()
      .then((steps) => {
        if (!cancelled) primeOnboardingSteps(steps);
      })
      .catch(() => {
        /* ignore — онбординг сам догрузит */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
