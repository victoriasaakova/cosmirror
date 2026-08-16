import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Отчёт — Cosmirror",
  description: "Персональный астрологический отчёт Cosmirror.",
};

export default function ReportRoute() {
  return <ReportPage />;
}
