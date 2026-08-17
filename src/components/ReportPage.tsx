"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, Suspense, useEffect, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { InteractiveReport } from "@/components/InteractiveReport";
import {
  completeDemoOrder,
  fetchOrder,
  resendOrderReport,
  type Order,
} from "@/lib/api";
import { readLastOrderId, writeLastOrderId } from "@/lib/onboarding/session";

function orderChannel(orderId: string): BroadcastChannel | null {
  try {
    return new BroadcastChannel(`cosmirror-order-${orderId}`);
  } catch {
    return null;
  }
}

function previewMode(raw: string | null): "pay" | "report" | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (raw === "pay" || raw === "waiting") return "pay";
  if (raw === "report" || raw === "generating") return "report";
  return null;
}

function isCheckoutReturnPath(pathname: string): boolean {
  return (
    pathname === "/success" ||
    pathname === "/success/" ||
    pathname === "/demo-success" ||
    pathname === "/demo-success/" ||
    pathname === "/pay/success" ||
    pathname === "/pay/success/"
  );
}

function ReportInner({ initialOrderId = "" }: { initialOrderId?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [storedOrderId, setStoredOrderId] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const orderId =
    initialOrderId ||
    searchParams.get("order") ||
    searchParams.get("order_id") ||
    storedOrderId;
  const fromProdamus =
    searchParams.get("from") === "prodamus" || isCheckoutReturnPath(pathname);
  const preview = previewMode(searchParams.get("preview"));
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);
  const [checkoutReturned, setCheckoutReturned] = useState(fromProdamus);
  const [revealReady, setRevealReady] = useState(false);
  const isLocalDemo = process.env.NODE_ENV === "development";
  const unpaidLocal =
    isLocalDemo &&
    Boolean(orderId) &&
    Boolean(order) &&
    order?.status !== "paid" &&
    order?.status !== "canceled" &&
    order?.status !== "denied";

  useEffect(() => {
    setStoredOrderId(readLastOrderId());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (orderId) writeLastOrderId(orderId);
  }, [orderId]);

  useEffect(() => {
    if (preview) return;
    if (!storageReady) return;
    if (!orderId) {
      setError("Не найден номер заказа. Открой ссылку из письма целиком.");
      return;
    }
    let cancelled = false;
    const channel = orderChannel(orderId);

    if (fromProdamus) {
      channel?.postMessage({ type: "checkout-returned" });
    }

    if (channel) {
      channel.onmessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; order?: Order } | undefined;
        if (!data || cancelled) return;
        if (data.type === "checkout-returned") {
          setCheckoutReturned(true);
        }
        if (data.type === "order" && data.order) {
          setOrder(data.order);
          setError("");
        }
      };
    }

    async function poll() {
      try {
        const next = await fetchOrder(orderId);
        if (cancelled) return;
        setOrder(next);
        setError("");
        if (next.customer_email) {
          setEmail((current) => current || next.customer_email || "");
        }
        if (next.status === "paid") {
          channel?.postMessage({ type: "order", order: next });
        }
        if (next.status === "canceled" || next.status === "denied") {
          return;
        }
        if (next.status === "paid" && next.report) {
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
      channel?.close();
    };
  }, [orderId, fromProdamus, preview, storageReady]);

  useEffect(() => {
    const paid = order?.status === "paid";
    if (!checkoutReturned && !paid) {
      setRevealReady(false);
      return;
    }
    const timer = window.setTimeout(() => setRevealReady(true), 2200);
    return () => window.clearTimeout(timer);
  }, [checkoutReturned, order?.status]);

  useEffect(() => {
    if (!isLocalDemo || preview || !orderId) return;
    if (!fromProdamus && !checkoutReturned) return;
    let cancelled = false;
    void completeDemoOrder(orderId)
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setCheckoutReturned(true);
        if (next.customer_email) {
          setEmail((current) => current || next.customer_email || "");
        }
        try {
          const channel = orderChannel(orderId);
          channel?.postMessage({ type: "order", order: next });
          channel?.close();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* poll подхватит, если webhook всё же дошёл */
      });
    return () => {
      cancelled = true;
    };
  }, [isLocalDemo, preview, orderId, fromProdamus, checkoutReturned]);

  useEffect(() => {
    if (!unpaidLocal || preview || !orderId) return;
    let cancelled = false;
    let hiddenOnce = false;

    const fulfill = () => {
      if (cancelled) return;
      void completeDemoOrder(orderId)
        .then((next) => {
          if (cancelled) return;
          setOrder(next);
          setCheckoutReturned(true);
          if (next.customer_email) {
            setEmail((current) => current || next.customer_email || "");
          }
        })
        .catch(() => {
          /* webhook на localhost не доходит — повтор через poll не поможет */
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenOnce = true;
      if (document.visibilityState === "visible" && hiddenOnce) fulfill();
    };

    document.addEventListener("visibilitychange", onVisibility);
    const fallback = window.setTimeout(fulfill, 12_000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(fallback);
    };
  }, [unpaidLocal, preview, orderId]);

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
  const showReport = Boolean(report) && revealReady;
  const generating =
    preview === "report" ||
    (!preview && Boolean(orderId) && !failed && !showReport && (confirmed || checkoutReturned));
  const waitingPayment =
    preview === "pay" ||
    (!preview && Boolean(order) && !failed && !confirmed && !checkoutReturned);
  const loading =
    !preview &&
    (!storageReady || (Boolean(orderId) && !order && !error && !checkoutReturned));
  const isStatus = loading || generating || waitingPayment;

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050d4a] text-white">
      {isStatus ? (
        <>
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
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 md:px-8 md:pt-8">
        <div className="flex shrink-0 items-center justify-center">
          <Link href="/" className="text-xl font-medium transition hover:opacity-90">
            <CosmirrorMark />
          </Link>
        </div>

        {loading ? (
          <StatusScreen titleBefore="" titleAccent="секунду">
            <p className="mt-4 font-grotesk text-base text-white/70 sm:text-lg">
              {error || "собираем страницу"}
            </p>
          </StatusScreen>
        ) : generating ? (
          <StatusScreen titleBefore="отчёт" titleAccent="формируется" showEye>
            <p className="mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white/70 sm:text-lg">
              собираю твой разбор — это займёт пару минут.
              <br />
              считаю положения планет по твоим данным рождения.
            </p>
          </StatusScreen>
        ) : waitingPayment ? (
          <StatusScreen titleBefore="остался один" titleAccent="шаг">
            <p className="mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white/70 sm:text-lg">
              {error ||
                "оплати заказ на защищённой странице Prodamus. после оплаты разбор откроется здесь"}
            </p>
            {order?.payment_url || preview === "pay" ? (
              <a
                href={order?.payment_url || "#"}
                target={order?.payment_url ? "cosmirror-prodamus" : undefined}
                rel="noopener noreferrer"
                className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a] transition-all hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98]"
              >
                К оплате
              </a>
            ) : null}
            {isLocalDemo ? (
              <p className="mt-5 max-w-sm font-grotesk text-sm leading-relaxed text-white/40">
                на localhost после оплаты смотри эту вкладку. Prodamus не умеет вернуться на
                http://localhost — кнопка «в магазин» откроет https и упадёт.
              </p>
            ) : null}
          </StatusScreen>
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
        ) : showReport && report ? (
          <article className="mt-8 pb-16">
            <div className="flex flex-col gap-3 sm:flex-row">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-base font-medium text-[#0a1a3a]"
                >
                  Скачать PDF
                </a>
              ) : null}
            </div>

            <form onSubmit={onResend} className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
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

            <InteractiveReport report={report} />
          </article>
        ) : (
          <div className="mt-16 text-center">
            <h1 className="font-display text-3xl italic text-[#F6E7A1]">Нет заказа</h1>
            <p className="mt-4 text-white/70">
              {error ||
                "Открой ссылку из письма целиком. Если снова пусто — PDF во вложении или hello@cosmirror.ru."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusScreen({
  titleBefore,
  titleAccent,
  children,
  showEye = false,
}: {
  titleBefore: string;
  titleAccent: string;
  children: ReactNode;
  showEye?: boolean;
}) {
  return (
    <div
      className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 text-center"
      role="status"
      aria-live="polite"
      aria-busy={showEye}
    >
      {showEye ? (
        <Image
          src="/images/eye-silver.webp"
          alt=""
          width={512}
          height={512}
          className="animate-eye-spin h-auto w-[min(46vw,11rem)] sm:w-[12rem]"
          sizes="(max-width: 640px) 46vw, 12rem"
          priority
        />
      ) : null}
      <h1
        className={`text-3xl font-normal leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem] ${
          showEye ? "mt-8" : ""
        }`}
      >
        {titleBefore ? (
          <>
            {titleBefore}{" "}
            <span className="font-display italic text-[#F6E7A1]">{titleAccent}</span>
          </>
        ) : (
          <span className="font-display italic text-[#F6E7A1]">{titleAccent}</span>
        )}
      </h1>
      {children}
    </div>
  );
}

export function ReportPage({ orderId = "" }: { orderId?: string } = {}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#050d4a] text-[#F6E7A1]">
          секунду
        </main>
      }
    >
      <ReportInner initialOrderId={orderId} />
    </Suspense>
  );
}
