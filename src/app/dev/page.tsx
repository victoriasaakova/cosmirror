import { notFound } from "next/navigation";
import { DevResetPage } from "@/components/DevResetPage";

export default function DevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevResetPage />;
}
