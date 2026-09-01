"use client";

import type { OnboardingInsight, OnboardingStep } from "@/lib/api";
import { InsightFunnel } from "@/components/InsightFunnel";

export function CabinetInsightPurchase({
  insight,
  steps,
  payloadByStep,
  error,
  submitting,
  signedIn,
  onContinue,
}: {
  insight: OnboardingInsight;
  steps: OnboardingStep[];
  payloadByStep: Record<string, Record<string, unknown>>;
  error: string;
  submitting: boolean;
  signedIn: boolean;
  onContinue: () => void;
}) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-2 md:pt-4"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
        <InsightFunnel
          screenIndex={0}
          insight={insight}
          steps={steps}
          payloadByStep={payloadByStep}
        />
      </div>
      <div className="shrink-0 pt-3">
        {error ? (
          <p className="mb-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 disabled:hover:scale-100 disabled:hover:bg-white/12 md:text-xl"
        >
          {submitting ? "Открываем…" : signedIn ? "Открыть кабинет" : "Узнать больше"}
        </button>
      </div>
    </form>
  );
}
