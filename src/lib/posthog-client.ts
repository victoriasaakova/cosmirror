"use client";

import posthog from "posthog-js";

const readyListeners = new Set<() => void>();

function isLoaded(): boolean {
  return Boolean((posthog as { __loaded?: boolean }).__loaded);
}

export function notifyPosthogReady(): void {
  readyListeners.forEach((listener) => listener());
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !isLoaded()) return;
  posthog.capture(event, properties);
}

export function getFeatureFlag(key: string): string | boolean | undefined {
  if (typeof window === "undefined" || !isLoaded()) return undefined;
  return posthog.getFeatureFlag(key);
}

export function registerSuperProperties(properties: Record<string, unknown>): void {
  if (typeof window === "undefined" || !isLoaded()) return;
  posthog.register(properties);
}

export function subscribeFeatureFlags(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let unsubscribeFlags: (() => void) | undefined;
  let cancelled = false;

  const attach = () => {
    if (cancelled || !isLoaded()) return;
    unsubscribeFlags = posthog.onFeatureFlags(() => {
      onChange();
    });
    onChange();
  };

  if (isLoaded()) {
    attach();
    return () => {
      cancelled = true;
      unsubscribeFlags?.();
    };
  }

  const onReady = () => {
    readyListeners.delete(onReady);
    attach();
  };
  readyListeners.add(onReady);

  return () => {
    cancelled = true;
    readyListeners.delete(onReady);
    unsubscribeFlags?.();
  };
}
