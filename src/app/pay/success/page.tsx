import type { Metadata } from "next";
import { PaySuccess } from "@/components/PaySuccess";

export const metadata: Metadata = {
  title: "Оплата — Cosmirror",
  description: "Статус оплаты персонального разбора Cosmirror.",
};

export default function PaySuccessPage() {
  return <PaySuccess />;
}
