"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { captureEvent } from "@/lib/posthog-client";

function PayFailedInner() {
  useEffect(() => {
    captureEvent("payment_failed");
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[#050d4a] text-white">
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10 md:px-8 md:py-14">
        <Link href="/" className="text-xl font-medium transition hover:opacity-90">
          <CosmirrorMark />
        </Link>
        <div className="mt-16 flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-normal leading-tight sm:text-4xl">
            Оплата не прошла.{" "}
            <span className="font-display italic text-[#F6E7A1]">это можно поправить</span>
          </h1>
          <p className="mt-6 text-[16px] leading-[1.55] text-white/75">
            Платёж отменили или банк его отклонил. Вернись к разбору и нажми оплату ещё раз.
          </p>
        </div>
        <Link href="/onboarding/insight/" className="cabinet-cta mt-10">
          Вернуться к разбору
        </Link>
      </div>
    </main>
  );
}

export function PayFailed() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#050d4a] text-[#F6E7A1]">
          секунду
        </main>
      }
    >
      <PayFailedInner />
    </Suspense>
  );
}
