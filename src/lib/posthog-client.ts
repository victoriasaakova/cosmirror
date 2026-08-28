"use client";

import posthog from "posthog-js";

function isLoaded(): boolean {
  return Boolean((posthog as { __loaded?: boolean }).__loaded);
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !isLoaded()) return;
  posthog.capture(event, properties);
}
