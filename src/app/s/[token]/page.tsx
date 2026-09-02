import type { Metadata } from "next";
import { SharedChartView } from "@/components/share/SharedChartView";
import { loadSharedChart } from "@/lib/share-chart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Натальная карта — Cosmirror",
  description: "Натальная карта и расшифровка, которой поделились через Cosmirror.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "no-referrer",
  openGraph: {
    url: "https://cosmirror.ru",
    title: "Натальная карта — Cosmirror",
    description: "Собери свою натальную карту с расшифровкой в Cosmirror.",
  },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedChartRoute({ params }: Props) {
  const { token } = await params;
  const report = await loadSharedChart(token);
  return <SharedChartView report={report} />;
}
