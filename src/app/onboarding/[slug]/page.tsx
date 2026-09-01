import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/OnboardingFlow";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    new?: string;
    code?: string;
    state?: string;
    error?: string;
    onboarding_purchase_flow?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Онбординг — ${slug} — Cosmirror`,
    description: "Познакомься с Cosmirror и начни собирать свою живую карту.",
  };
}

export default async function OnboardingStepPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const forceNew = query.new === "1";
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <OnboardingFlow
        slug={slug}
        forceNew={forceNew}
        oauthCode={query.code ?? ""}
        oauthState={query.state ?? ""}
        oauthError={query.error ?? ""}
        purchaseFlowOverride={query.onboarding_purchase_flow ?? ""}
      />
    </div>
  );
}
