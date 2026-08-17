import type { Metadata } from "next";
import { CheckoutReturn } from "@/components/CheckoutReturn";

export const metadata: Metadata = {
  title: "Оплата — Cosmirror",
  description: "Статус оплаты персонального разбора Cosmirror.",
};

/** Prodamus после оплаты часто открывает /success на localhost. */
export default function SuccessPage() {
  return <CheckoutReturn />;
}
