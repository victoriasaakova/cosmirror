import type { Metadata } from "next";
import { CompatibilityPage } from "@/components/compatibility/CompatibilityPage";

export const metadata: Metadata = {
  title: "Совместимость — Cosmirror",
  description: "Исследуй свои отношения по натальной карте.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompatibilityPage />;
}
