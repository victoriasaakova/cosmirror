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

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a] text-white">
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10 md:px-8 md:py-14">
        <Link href="/" className="text-xl font-medium transition hover:opacity-90">
          <CosmirrorMark />
        </Link>

        <div className="mt-16 flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl">
            {failed ? (
              <>
                Оплата не прошла.{" "}
                <span className="font-display italic text-[#F6E7A1]">можно попробовать ещё раз</span>
              </>
            ) : confirmed ? (
              <>
                Оплата прошла.{" "}
                <span className="font-display italic text-[#F6E7A1]">разбор уже в работе</span>
              </>
            ) : (
              <>
                Оплата открыта.{" "}
                <span className="font-display italic text-[#F6E7A1]">заверши её во вкладке Prodamus</span>
              </>
            )}
          </h1>
          <p className="mt-6 text-[16px] font-normal leading-[1.55] text-white/75 sm:text-[17px]">
            {failed
              ? "Платёж отменили или банк его отклонил. Вернись к разбору и нажми оплату ещё раз."
              : confirmed
                ? "Подтверждение пришло от платёжного сервиса. Персональный астрологический отчёт отправим на email, который ты указала в онбординге."
                : error ||
                  "Эта вкладка Cosmirror остаётся открытой. Оплата — во второй вкладке Prodamus. Демо-отчёт от нас уйдёт на почту, которую ты указала, с адреса hello@cosmirror.ru."
          </p>
          {order ? (
            <p className="mt-4 text-sm text-white/40">
              Заказ {order.id.slice(0, 8)} · {order.amount} ₽ · {statusLabel(order.status)}
            </p>
          ) : null}
        </div>

        {waiting && order?.payment_url ? (
          <a
            href={order.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98] md:text-xl"
          >
            Открыть оплату
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

function statusLabel(status: string): string {
  if (status === "paid") return "оплачен";
  if (status === "awaiting_payment") return "ожидает подтверждение";
  if (status === "canceled") return "отменён";
  if (status === "denied") return "отклонён";
  if (status === "failed") return "ошибка";
  return status;
}

export function PaySuccess() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#050d4a] text-white/50">
          Открываем страницу успеха…
        </main>
      }
    >
      <PaySuccessInner />
    </Suspense>
  );
}
