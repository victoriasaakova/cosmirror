import type { Metadata } from "next";
import { CompatibilityPage } from "@/components/compatibility/CompatibilityPage";

export const metadata: Metadata = {
  title: "Совместимость — Cosmirror",
  description: "Исследуйте связь через две натальные карты.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompatibilityPage />;
}
