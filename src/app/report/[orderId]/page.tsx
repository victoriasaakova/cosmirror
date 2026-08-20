import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Кабинет — Cosmirror",
  description: "Персональный астрологический отчёт в кабинете Cosmirror.",
};

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function ReportByIdPage(_props: Props) {
  return <ReportPage />;
}
