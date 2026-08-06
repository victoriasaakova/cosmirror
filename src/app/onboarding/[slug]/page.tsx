import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/OnboardingFlow";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Онбординг — ${slug} — Cosmirror`,
    description: "Познакомься с Cosmirror и начни собирать свою живую карту.",
  };
}

export default async function OnboardingStepPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <OnboardingFlow slug={slug} />
    </div>
  );
}
