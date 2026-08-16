import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Оплата — Cosmirror",
  description: "Статус оплаты персонального разбора Cosmirror.",
};

export default function PaySuccessPage() {
  return <ReportPage />;
}
