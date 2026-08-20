import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Кабинет — Cosmirror",
  description: "Персональный астрологический отчёт в кабинете Cosmirror.",
};

export default function AccountPage() {
  return <ReportPage />;
}
