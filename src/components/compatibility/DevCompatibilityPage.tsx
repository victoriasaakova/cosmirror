"use client";

import { CompatibilityPage } from "@/components/compatibility/CompatibilityPage";
import { DEV_COMPATIBILITY_PRESET } from "@/lib/compatibility/dev-fixture";

export function DevCompatibilityPage() {
  return <CompatibilityPage devPreset={DEV_COMPATIBILITY_PRESET} />;
}
