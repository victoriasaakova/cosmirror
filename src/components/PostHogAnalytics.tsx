"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useCookieConsent } from "@/components/CookieConsent";
import { useAuth } from "@/components/AuthProvider";
import {
  DEFAULT_ONBOARDING_PURCHASE_FLOW,
  ONBOARDING_PURCHASE_FLOW_FLAG,
  parseOnboardingPurchaseFlow,
} from "@/lib/flags/onboarding-purchase-flow";
import { notifyPosthogReady } from "@/lib/posthog-client";

const PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const API_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const BOOTSTRAP_PURCHASE_FLOW =
  parseOnboardingPurchaseFlow(process.env.NEXT_PUBLIC_ONBOARDING_PURCHASE_FLOW) ??
  DEFAULT_ONBOARDING_PURCHASE_FLOW;

export function PostHogAnalytics() {
  const { ready, analyticsAllowed } = useCookieConsent();
  const { ready: authReady, user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const identified = useRef(false);

  useEffect(() => {
    if (!ready || !analyticsAllowed || !PROJECT_TOKEN || started.current) return;

    posthog.init(PROJECT_TOKEN, {
      api_host: API_HOST,
      defaults: "2026-05-30",
      capture_pageview: false,
      person_profiles: "identified_only",
      bootstrap: {
        featureFlags: {
          [ONBOARDING_PURCHASE_FLOW_FLAG]: BOOTSTRAP_PURCHASE_FLOW,
        },
      },
    });
    started.current = true;
    notifyPosthogReady();
  }, [ready, analyticsAllowed]);

  useEffect(() => {
    if (!started.current || !analyticsAllowed) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams, analyticsAllowed]);

  useEffect(() => {
    if (!started.current || !authReady || !analyticsAllowed) return;
    if (user) {
      posthog.identify(String(user.id), {
        email: user.email || undefined,
        name: user.display_name || user.first_name || undefined,
        has_paid_report: Boolean(user.has_paid_report),
      });
      identified.current = true;
      return;
    }
    if (identified.current) {
      posthog.reset();
      identified.current = false;
    }
  }, [analyticsAllowed, authReady, user]);

  return null;
}
