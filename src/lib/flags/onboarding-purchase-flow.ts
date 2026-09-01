/**
 * Feature flag for the onboarding → purchase funnel.
 *
 * Variants stay implemented side by side — A/B and rollback both depend on it.
 *
 * Resolution, highest wins:
 * 1. URL `?onboarding_purchase_flow=`
 * 2. localStorage `cosmirror.flag.onboarding-purchase-flow`
 * 3. `NEXT_PUBLIC_ONBOARDING_PURCHASE_FLOW` (force a variant for everyone)
 * 4. PostHog multivariate flag `onboarding-purchase-flow` (A/B)
 * 5. Default `cabinet`
 *
 * Unknown values fall back to `cabinet`.
 */

export const ONBOARDING_PURCHASE_FLOW_FLAG = "onboarding-purchase-flow";

export const ONBOARDING_PURCHASE_FLOW_QUERY = "onboarding_purchase_flow";

export const ONBOARDING_PURCHASE_FLOW_STORAGE_KEY =
  "cosmirror.flag.onboarding-purchase-flow";

export const ONBOARDING_PURCHASE_FLOW = {
  /**
   * Legacy prod:
   * quiz + natal chart → Yandex on /contacts → insight funnel → pay in onboarding.
   */
  IMMEDIATE: "immediate",
  /**
   * Current prod:
   * quiz + natal chart → insight → Yandex → cabinet with free natal,
   * locked remaining tabs, paywall from the cabinet.
   */
  CABINET: "cabinet",
} as const;

export type OnboardingPurchaseFlow =
  (typeof ONBOARDING_PURCHASE_FLOW)[keyof typeof ONBOARDING_PURCHASE_FLOW];

export const DEFAULT_ONBOARDING_PURCHASE_FLOW: OnboardingPurchaseFlow =
  ONBOARDING_PURCHASE_FLOW.CABINET;

export type OnboardingPurchaseFlowSource =
  | "query"
  | "storage"
  | "env"
  | "posthog"
  | "default";

export type ResolvedOnboardingPurchaseFlow = {
  flow: OnboardingPurchaseFlow;
  source: OnboardingPurchaseFlowSource;
};

const KNOWN_FLOWS = new Set<string>(Object.values(ONBOARDING_PURCHASE_FLOW));

export function isOnboardingPurchaseFlow(
  value: unknown,
): value is OnboardingPurchaseFlow {
  return typeof value === "string" && KNOWN_FLOWS.has(value);
}

export function isImmediateOnboardingPurchase(
  flow: OnboardingPurchaseFlow,
): boolean {
  return flow === ONBOARDING_PURCHASE_FLOW.IMMEDIATE;
}

export function isCabinetOnboardingPurchase(
  flow: OnboardingPurchaseFlow,
): boolean {
  return flow === ONBOARDING_PURCHASE_FLOW.CABINET;
}

export function parseOnboardingPurchaseFlow(
  raw: unknown,
): OnboardingPurchaseFlow | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  return isOnboardingPurchaseFlow(value) ? value : null;
}

export function resolveOnboardingPurchaseFlow(input: {
  query?: string | null;
  storage?: string | null;
  env?: string | null;
  posthog?: string | boolean | null;
}): ResolvedOnboardingPurchaseFlow {
  const query = parseOnboardingPurchaseFlow(input.query);
  if (query) return { flow: query, source: "query" };

  const storage = parseOnboardingPurchaseFlow(input.storage);
  if (storage) return { flow: storage, source: "storage" };

  const env = parseOnboardingPurchaseFlow(input.env);
  if (env) return { flow: env, source: "env" };

  const posthog = parseOnboardingPurchaseFlow(input.posthog);
  if (posthog) return { flow: posthog, source: "posthog" };

  return { flow: DEFAULT_ONBOARDING_PURCHASE_FLOW, source: "default" };
}

export function readOnboardingPurchaseFlowStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ONBOARDING_PURCHASE_FLOW_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** QA helper: pin a variant in this browser. Pass null to clear. */
export function writeOnboardingPurchaseFlowStorage(
  flow: OnboardingPurchaseFlow | null,
): void {
  if (typeof window === "undefined") return;
  try {
    if (!flow) {
      window.localStorage.removeItem(ONBOARDING_PURCHASE_FLOW_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ONBOARDING_PURCHASE_FLOW_STORAGE_KEY, flow);
  } catch {
    /* private mode */
  }
}
