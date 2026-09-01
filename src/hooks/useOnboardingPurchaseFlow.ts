"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ONBOARDING_PURCHASE_FLOW_FLAG,
  resolveOnboardingPurchaseFlow,
  readOnboardingPurchaseFlowStorage,
  type ResolvedOnboardingPurchaseFlow,
} from "@/lib/flags/onboarding-purchase-flow";
import {
  getFeatureFlag,
  registerSuperProperties,
  subscribeFeatureFlags,
} from "@/lib/posthog-client";

const ENV_FLOW = process.env.NEXT_PUBLIC_ONBOARDING_PURCHASE_FLOW ?? null;

export function useOnboardingPurchaseFlow(
  queryOverride?: string | null,
): ResolvedOnboardingPurchaseFlow {
  const [posthogValue, setPosthogValue] = useState<string | boolean | undefined>(
    () => getFeatureFlag(ONBOARDING_PURCHASE_FLOW_FLAG),
  );
  const [storageValue, setStorageValue] = useState<string | null>(null);
  const [flagsEpoch, setFlagsEpoch] = useState(0);

  useEffect(() => {
    setStorageValue(readOnboardingPurchaseFlowStorage());
  }, []);

  useEffect(() => {
    return subscribeFeatureFlags(() => {
      setPosthogValue(getFeatureFlag(ONBOARDING_PURCHASE_FLOW_FLAG));
      setFlagsEpoch((n) => n + 1);
    });
  }, []);

  const resolved = useMemo(
    () =>
      resolveOnboardingPurchaseFlow({
        query: queryOverride,
        storage: storageValue,
        env: ENV_FLOW,
        posthog: posthogValue,
      }),
    [queryOverride, storageValue, posthogValue],
  );

  useEffect(() => {
    registerSuperProperties({
      onboarding_purchase_flow: resolved.flow,
      onboarding_purchase_flow_source: resolved.source,
    });
  }, [resolved.flow, resolved.source, flagsEpoch]);

  return resolved;
}
