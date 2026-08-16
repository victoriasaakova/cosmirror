"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import {
  fetchOrder,
  resendOrderReport,
  type Order,
  type PaidReport,
} from "@/lib/api";

function ReportInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("Не найден номер заказа.");
      return;
    }
    let cancelled = false;

    async function poll() {
      try {
        const next = await fetchOrder(orderId);
        if (cancelled) return;
        setOrder(next);
        setError("");
        if (next.customer_email) {
          setEmail((current) => current || next.customer_email || "");
        }
        if (next.status === "paid" || next.status === "canceled" || next.status === "denied") {
          return;
        }
        window.setTimeout(() => {
          void poll();
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Не удалось проверить оплату");
        window.setTimeout(() => {
          void poll();
        }, 4000);
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function onResend(event: FormEvent) {
    event.preventDefault();
    if (!orderId || sending) return;
    setSending(true);
    setEmailNote("");
    try {
      const next = await resendOrderReport(orderId, email);
      setOrder(next);
      setEmailNote(`Отчёт отправили на ${next.customer_email}.`);
    } catch (err) {
      setEmailNote(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setSending(false);
    }
  }

  const failed = order?.status === "canceled" || order?.status === "denied";
  const confirmed = order?.status === "paid";
  const report = confirmed ? order?.report : null;
  const pdfUrl = order?.report_pdf_url || "";
  const waiting = Boolean(order) && !failed && !confirmed;
  const loading = Boolean(orderId) && !order && !error;

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a] text-white">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10 md:px-8 md:py-14">
        <Link href="/" className="text-xl font-medium transition hover:opacity-90">
          <CosmirrorMark />
        </Link>

        {loading || waiting ? (
          <div className="mt-24 text-center" role="status" aria-live="polite">
            <h1 className="font-display text-3xl italic text-[#F6E7A1] sm:text-4xl">
              {loading ? "секунду" : "оплата рядом"}
            </h1>
            <p className="mt-3 text-white/70">
              {error ||
                (waiting
                  ? "закончи её во вкладке Prodamus — отчёт откроется здесь"
                  : "собираем страницу")}
            </p>
            {waiting && order?.payment_url ? (
              <a
                href={order.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a]"
              >
                К оплате
              </a>
            ) : null}
          </div>
        ) : failed ? (
          <div className="mt-16">
            <h1 className="text-3xl font-normal leading-tight sm:text-4xl">
              Оплата не прошла.{" "}
              <span className="font-display italic text-[#F6E7A1]">можно попробовать ещё раз</span>
            </h1>
            <p className="mt-6 text-white/75">
              Платёж отменили или банк его отклонил. Вернись к разбору и нажми оплату ещё раз.
            </p>
            <Link
              href="/onboarding/insight/"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a]"
            >
              Вернуться к разбору
            </Link>
          </div>
        ) : report ? (
          <article className="mt-10 pb-16">
            <p className="text-xs uppercase tracking-[0.18em] text-[#F6E7A1]">Отчёт</p>
            <h1 className="mt-3 font-display text-3xl italic leading-tight text-white sm:text-4xl">
              {report.title}
            </h1>
            {report.subtitle ? (
              <p className="mt-3 text-sm text-white/55">{report.subtitle}</p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-base font-medium text-[#0a1a3a]"
                >
                  Скачать PDF
                </a>
              ) : null}
            </div>

            <form onSubmit={onResend} className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/75">
                {order?.fulfilled_at
                  ? `Копия ушла на ${order.customer_email || "указанную почту"}. Если адрес неверный — поправь.`
                  : `Письмо не ушло${order?.customer_email ? ` на ${order.customer_email}` : ""}. Укажи почту — отправим PDF.`}
              </p>
              {order?.fulfillment_error && !order.fulfilled_at ? (
                <p className="mt-2 text-sm text-red-300">{order.fulfillment_error}</p>
              ) : null}
              <label className="mt-4 block">
                <span className="sr-only">Email для отчёта</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email"
                  className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-[#F6E7A1]/60"
                />
              </label>
              <button
                type="submit"
                disabled={sending}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[#F6E7A1]/40 px-8 py-2.5 text-base text-[#F6E7A1] disabled:opacity-50"
              >
                {sending ? "Отправляем…" : "Отправить PDF на почту"}
              </button>
              {emailNote ? <p className="mt-3 text-sm text-white/70">{emailNote}</p> : null}
            </form>

            <ReportBody report={report} />
          </article>
        ) : (
          <div className="mt-16">
            <h1 className="font-display text-3xl italic text-[#F6E7A1]">Нет заказа</h1>
            <p className="mt-4 text-white/70">{error || "Открой ссылку после оплаты."}</p>
          </div>
        )}
      </div>
    </main>
  );
}

function ReportBody({ report }: { report: PaidReport }) {
  return (
    <div className="mt-12 space-y-12">
      {report.sections.map((section) => (
        <section key={section.id}>
          <h2 className="text-xs uppercase tracking-[0.18em] text-[#F6E7A1]">{section.title}</h2>
          <div className="mt-5 space-y-6">
            {section.blocks.map((block) => (
              <div key={`${section.id}-${block.title}`}>
                <h3 className="text-lg font-medium leading-snug">{block.title}</h3>
                <p className="mt-2 text-[16px] leading-[1.6] text-white/78">{block.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {report.disclaimer ? (
        <p className="text-sm leading-relaxed text-white/45">{report.disclaimer}</p>
      ) : null}
    </div>
  );
}

export function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#050d4a] text-[#F6E7A1]">
          секунду
        </main>
      }
    >
      <ReportInner />
    </Suspense>
  );
}
