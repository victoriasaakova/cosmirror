import type { Metadata } from "next";
import { PayFailed } from "@/components/PayFailed";

export const metadata: Metadata = {
  title: "Оплата не прошла — Cosmirror",
  description: "Платёж Cosmirror не завершился.",
};

export default function PayFailedPage() {
  return <PayFailed />;
}
