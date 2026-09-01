"use client";

import type { ReactNode } from "react";
import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import {
  INSIGHT_SCREEN_COUNT,
  InsightFunnel,
  insightCtaLabel,
} from "@/components/InsightFunnel";

/**
 * Current production onboarding purchase (`onboarding-purchase-flow=immediate`).
 * Auth after the chart → insight funnel → pay from the last onboarding screen.
 * Keep this component when adding another funnel variant.
 */
export function ImmediateOnboardingPurchase({
  screenIndex,
  insight,
  steps,
  payloadByStep,
  error,
  submitting,
  sessionToken,
  confirmReady,
  isInsightConfirm,
  confirmStep,
  onCheckout,
  onAdvance,
}: {
  screenIndex: number;
  insight: OnboardingInsight;
  steps: OnboardingStep[];
  payloadByStep: Record<string, Record<string, unknown>>;
  error: string;
  submitting: boolean;
  sessionToken: string | null;
  confirmReady: boolean;
  isInsightConfirm: boolean;
  confirmStep: ReactNode;
  onCheckout: () => void;
  onAdvance: () => void;
}) {
  const hideConfirmFieldError =
    isInsightConfirm &&
    (error.toLowerCase().includes("telegram") ||
      error.toLowerCase().includes("email") ||
      error.toLowerCase().includes("реальн") ||
      error.toLowerCase().includes("верифицировать"));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (isInsightConfirm) {
          if (!confirmReady || submitting) return;
          onCheckout();
          return;
        }
        onAdvance();
      }}
      className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-2 md:pt-4"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
        {isInsightConfirm ? (
          confirmStep
        ) : (
          <InsightFunnel
            screenIndex={screenIndex}
            insight={insight}
            steps={steps}
            payloadByStep={payloadByStep}
          />
        )}
      </div>
      <div className="shrink-0 pt-3">
        {error && !hideConfirmFieldError ? (
          <p
            className={`mb-2 text-sm ${
              error.toLowerCase().includes("оферт") || error.toLowerCase().includes("соглас")
                ? "text-[#F6E7A1]"
                : "text-red-300"
            }`}
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {screenIndex >= INSIGHT_SCREEN_COUNT - 1 ? (
          <button
            type="submit"
            disabled={submitting || !sessionToken || !confirmReady}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:scale-100 disabled:hover:bg-white/12 md:text-xl"
          >
            {submitting ? "Открываем оплату…" : insightCtaLabel(screenIndex, insight)}
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
          >
            {insightCtaLabel(screenIndex, insight)}
          </button>
        )}
      </div>
    </form>
  );
}
