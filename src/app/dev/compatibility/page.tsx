import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevCompatibilityPage } from "@/components/compatibility/DevCompatibilityPage";

export const metadata: Metadata = {
  title: "Совместимость — локальный прогон",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevCompatibilityPage />;
}
