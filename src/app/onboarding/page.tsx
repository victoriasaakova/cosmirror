import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const metadata: Metadata = {
  title: "Онбординг — Cosmirror",
  description: "Познакомься с Cosmirror и начни собирать свою живую карту.",
};

export default function OnboardingPage() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <OnboardingFlow />
    </div>
  );
}
