import type { Metadata } from "next";
import { CheckoutReturn } from "@/components/CheckoutReturn";

export const metadata: Metadata = {
  title: "Оплата — Cosmirror",
  description: "Статус оплаты персонального разбора Cosmirror.",
};

export default function DemoSuccessPage() {
  return <CheckoutReturn />;
}
