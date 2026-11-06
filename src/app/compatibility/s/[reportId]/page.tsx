import type { Metadata } from "next";
import { SharedCompatibilityView } from "@/components/compatibility/SharedCompatibilityView";
import { loadSharedCompatibility } from "@/lib/compatibility/live-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Совместимость — Cosmirror",
  description: "Разбор совместимости, которым поделились через Cosmirror.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "no-referrer",
  openGraph: {
    url: "https://cosmirror.ru",
    title: "Совместимость — Cosmirror",
    description: "Исследуй свои отношения по натальной карте в Cosmirror.",
  },
};

type Props = {
  params: Promise<{ reportId: string }>;
};

export default async function SharedCompatibilityPage({ params }: Props) {
  const { reportId } = await params;
  const data = await loadSharedCompatibility(reportId);
  return <SharedCompatibilityView data={data} />;
}
