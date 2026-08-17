"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { completeDemoOrder, type Order } from "@/lib/api";
import { readLastOrderId, writeLastOrderId } from "@/lib/onboarding/session";

function notifyOrder(orderId: string, payload: { type: string; order?: Order }) {
  try {
    const channel = new BroadcastChannel(`cosmirror-order-${orderId}`);
    channel.postMessage(payload);
    channel.close();
  } catch {
    /* Safari private mode */
  }
}

function GeneratingShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a] text-white">
      <Image
        src="/images/hero-coastal-moon-trail_4.webp"
        alt=""
        fill
        priority
        className="object-cover object-[center_68%]"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050d4a]/85 via-[#050d4a]/55 to-[#050d4a]/75"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050d4a]/90"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 md:px-8 md:pt-8">
        <div className="flex shrink-0 items-center justify-center">
          <span className="text-xl font-medium">
            <CosmirrorMark />
          </span>
        </div>
        <div
          className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 text-center"
          role="status"
          aria-live="polite"
          aria-busy
        >
          <Image
            src="/images/eye-silver.webp"
            alt=""
            width={512}
            height={512}
            className="animate-eye-spin h-auto w-[min(46vw,11rem)] sm:w-[12rem]"
            sizes="(max-width: 640px) 46vw, 12rem"
            priority
          />
          <h1 className="mt-8 text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
            отчёт <span className="font-display italic text-[#F6E7A1]">формируется</span>
          </h1>
          {children}
        </div>
      </div>
    </main>
  );
}

function CheckoutReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const orderId =
      searchParams.get("order_id") ||
      searchParams.get("order") ||
      readLastOrderId();
    if (!orderId) {
      setMissing(true);
      return;
    }
    writeLastOrderId(orderId);
    notifyOrder(orderId, { type: "checkout-returned" });

    let cancelled = false;
    void completeDemoOrder(orderId)
      .then((order) => {
        if (cancelled) return;
        notifyOrder(orderId, { type: "order", order });
        router.replace(`/report/${orderId}/?from=prodamus`);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace(`/report/${orderId}/?from=prodamus`);
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <GeneratingShell>
      <p className="mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white/70 sm:text-lg">
        {missing
          ? "не найден номер заказа — открой вкладку Cosmirror, где ждёт оплата"
          : "собираю твой разбор — это займёт пару минут."}
        {missing ? null : (
          <>
            <br />
            считаю положения планет по твоим данным рождения.
          </>
        )}
      </p>
    </GeneratingShell>
  );
}

export function CheckoutReturn() {
  return (
    <Suspense
      fallback={
        <GeneratingShell>
          <p className="mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white/70 sm:text-lg">
            собираю твой разбор — это займёт пару минут.
          </p>
        </GeneratingShell>
      }
    >
      <CheckoutReturnInner />
    </Suspense>
  );
}
