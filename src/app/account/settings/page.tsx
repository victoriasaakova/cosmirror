import type { Metadata } from "next";
import { ReportPage } from "@/components/ReportPage";

export const metadata: Metadata = {
  title: "Аккаунт — Cosmirror",
  description: "Настройки аккаунта Cosmirror: данные рождения, выход и удаление.",
};

export default function AccountSettingsPage() {
  return <ReportPage initialSection="account" />;
}
