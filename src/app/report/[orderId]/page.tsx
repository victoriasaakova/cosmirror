import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Отчёт — Cosmirror",
  description: "Персональный астрологический отчёт Cosmirror.",
};

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function ReportByIdPage({ params }: Props) {
  const { orderId } = await params;
  return <ReportPage orderId={orderId} />;
}
