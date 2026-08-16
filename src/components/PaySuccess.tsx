"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { fetchOrder, type Order } from "@/lib/api";

function PaySuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Не найден номер заказа.");
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const next = await fetchOrder(orderId);
        if (cancelled) return;
        setOrder(next);
        setError("");
        if (next.status === "paid" || next.status === "canceled" || next.status === "denied") {
          return;
        }
        if (attempts >= 30) return;
        attempts += 1;
        window.setTimeout(() => {
          void poll();
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не удалось проверить оплату");
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const failed = order?.status === "canceled" || order?.status === "denied";
  const confirmed = order?.status === "paid";
  const waiting = Boolean(order) && !failed && !confirmed;
  const loading = Boolean(orderId) && !order && !error;

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a] text-white">
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10 md:px-8 md:py-14">
        <Link href="/" className="text-xl font-medium transition hover:opacity-90">
          <CosmirrorMark />
        </Link>

        <div
          className="mt-16 flex flex-1 flex-col justify-center"
          role="status"
          aria-live="polite"
        >
          {loading ? (
            <WaitCopy title="секунду" subtitle="скоро закончим" />
          ) : failed ? (
            <>
              <h1 className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl">
                Оплата не прошла.{" "}
                <span className="font-display italic text-[#F6E7A1]">можно попробовать ещё раз</span>
              </h1>
              <p className="mt-6 text-[16px] font-normal leading-[1.55] text-white/75 sm:text-[17px]">
                Платёж отменили или банк его отклонил. Вернись к разбору и нажми оплату ещё раз.
              </p>
            </>
          ) : confirmed ? (
            <>
              <h1 className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl">
                Оплата прошла.{" "}
                <span className="font-display italic text-[#F6E7A1]">разбор уже в работе</span>
              </h1>
              <p className="mt-6 text-[16px] font-normal leading-[1.55] text-white/75 sm:text-[17px]">
                Персональный отчёт отправим на почту с hello@cosmirror.ru.
              </p>
            </>
          ) : (
            <>
              <WaitCopy
                title="оплата рядом"
                subtitle={
                  error ||
                  "закончи её в соседней вкладке. это окно можно не закрывать"
                }
              />
            </>
          )}
        </div>

        {waiting && order?.payment_url ? (
          <a
            href={order.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
          >
            К оплате
          </a>
        ) : (
          <Link
            href={failed ? "/onboarding/insight/" : "/"}
            className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
          >
            {failed ? "Вернуться к разбору" : "На главную"}
          </Link>
        )}
      </div>
    </main>
  );
}

function WaitCopy({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-normal italic leading-snug tracking-normal text-[#F6E7A1] sm:text-4xl md:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-3 font-grotesk text-base font-normal text-white/70 sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}

export function PaySuccess() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#050d4a] px-5 text-center">
          <WaitCopy title="секунду" subtitle="скоро закончим" />
        </main>
      }
    >
      <PaySuccessInner />
    </Suspense>
  );
}
