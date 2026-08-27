import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Отчёт — Cosmirror",
  description: "Персональный астрологический отчёт Cosmirror.",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedReportPage(_props: Props) {
  return <ReportPage />;
}
