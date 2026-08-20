"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, Suspense, useEffect, useState } from "react";
import { CosmirrorMark } from "@/components/CosmirrorMark";
import { InteractiveReport } from "@/components/InteractiveReport";
import {
  completeMyDemoOrder,
  downloadMyReportPdf,
  fetchMyOrder,
  resendMyReport,
  type Order,
} from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

function orderChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel("cosmirror-account-report");
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
    pathname === "/pay/success/" ||
    pathname === "/account" ||
    pathname === "/account/"
  );
}

function ReportInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const fromProdamus =
    searchParams.get("from") === "prodamus" || isCheckoutReturnPath(pathname);
  const preview = previewMode(searchParams.get("preview"));
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [checkoutReturned, setCheckoutReturned] = useState(fromProdamus);
  const [revealReady, setRevealReady] = useState(false);
  const [paymentSlow, setPaymentSlow] = useState(false);
  const isLocalDemo = process.env.NODE_ENV === "development";
  const unpaidLocal =
    isLocalDemo &&
    Boolean(order) &&
    order?.status !== "paid" &&
    order?.status !== "canceled" &&
    order?.status !== "denied";

  useEffect(() => {
    if (preview) return;
    if (!isLoggedIn()) {
      setNeedsAuth(true);
      setError("Войди через Яндекс ID, чтобы открыть отчёт.");
      return;
    }
    let cancelled = false;
    const channel = orderChannel();

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

    const startedAt = Date.now();
    let timer = 0;

    function delayFor(status: string, errored: boolean) {
      const elapsed = Date.now() - startedAt;
      if (errored) return elapsed > 60_000 ? 10_000 : 4_000;
      if (status === "paid") return 2_000;
      if (elapsed > 180_000) return 15_000;
      if (elapsed > 90_000) return 8_000;
      if (elapsed > 30_000) return 4_000;
      return 2_000;
    }

    async function poll() {
      try {
        const next = await fetchMyOrder();
        if (cancelled) return;
        setOrder(next);
        setError("");
        setNeedsAuth(false);
        if (next.status === "paid") {
          channel?.postMessage({ type: "order", order: next });
          setPaymentSlow(false);
        } else if (Date.now() - startedAt > 90_000) {
          setPaymentSlow(true);
        }
        if (next.status === "canceled" || next.status === "denied") {
          return;
        }
        if (next.status === "paid" && next.report) {
          return;
        }
        timer = window.setTimeout(() => {
          void poll();
        }, delayFor(next.status, false));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Не удалось проверить оплату";
        if (message.toLowerCase().includes("яндекс")) {
          setNeedsAuth(true);
        }
        setError(message);
        timer = window.setTimeout(() => {
          void poll();
        }, delayFor("", true));
      }
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      channel?.close();
    };
  }, [fromProdamus, preview]);

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
    if (!isLocalDemo || preview) return;
    if (!fromProdamus && !checkoutReturned) return;
    let cancelled = false;
    void completeMyDemoOrder()
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setCheckoutReturned(true);
        try {
          const channel = orderChannel();
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
  }, [isLocalDemo, preview, fromProdamus, checkoutReturned]);

  useEffect(() => {
    if (!unpaidLocal || preview) return;
    let cancelled = false;
    let hiddenOnce = false;

    const fulfill = () => {
      if (cancelled) return;
      void completeMyDemoOrder()
        .then((next) => {
          if (cancelled) return;
          setOrder(next);
          setCheckoutReturned(true);
        })
        .catch(() => {
          /* webhook на localhost не доходит */
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
  }, [unpaidLocal, preview]);

  async function onResend(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setEmailNote("");
    try {
      const next = await resendMyReport("");
      setOrder(next);
      setEmailNote("PDF отправили на почту Яндекс ID.");
    } catch (err) {
      setEmailNote(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setSending(false);
    }
  }

  async function onDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await downloadMyReportPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cosmirror-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setEmailNote(err instanceof Error ? err.message : "Не удалось скачать PDF");
    } finally {
      setDownloading(false);
    }
  }

  const failed = order?.status === "canceled" || order?.status === "denied";
  const confirmed = order?.status === "paid";
  const report = confirmed ? order?.report : null;
  const showReport = Boolean(report) && revealReady;
  const generating =
    preview === "report" ||
    (!preview && !failed && !showReport && (confirmed || checkoutReturned) && !needsAuth);
  const waitingPayment =
    preview === "pay" ||
    (!preview && Boolean(order) && !failed && !confirmed && !checkoutReturned);
  const loading =
    !preview && !needsAuth && !order && !error && !checkoutReturned;
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

        {needsAuth ? (
          <div className="mt-16 text-center">
            <h1 className="text-3xl font-normal leading-tight sm:text-4xl">
              Отчёт в{" "}
              <span className="font-display italic text-[#F6E7A1]">личном кабинете</span>
            </h1>
            <p className="mt-6 text-white/75">
              {error || "Войди через Яндекс ID, чтобы открыть разбор."}
            </p>
            <Link
              href="/onboarding/contacts/"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a]"
            >
              Войти через Яндекс ID
            </Link>
          </div>
        ) : loading ? (
          <StatusScreen titleBefore="" titleAccent="секунду">
            <p className="mt-4 font-grotesk text-base text-white/70 sm:text-lg">
              {error || "собираем страницу"}
            </p>
          </StatusScreen>
        ) : generating ? (
          <StatusScreen titleBefore="отчёт" titleAccent="формируется" showEye>
            <p className="mt-4 max-w-md font-grotesk text-base font-normal leading-relaxed text-white/70 sm:text-lg">
              {paymentSlow && order?.status !== "paid"
                ? "оплата ещё подтверждается. не закрывай страницу — отчёт откроется сам, как только банк пришлёт уведомление."
                : "собираю твой разбор — это займёт пару минут."}
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
              <button
                type="button"
                onClick={() => void onDownloadPdf()}
                disabled={downloading}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#F6E7A1] px-8 py-2.5 font-grotesk text-base font-medium text-[#0a1a3a] disabled:opacity-50"
              >
                {downloading ? "Готовим PDF…" : "Скачать PDF"}
              </button>
            </div>

            <form onSubmit={onResend} className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/75">
                {order?.fulfilled_at
                  ? "Копия PDF ушла на почту Яндекс ID."
                  : "Можно отправить PDF на почту аккаунта."}
              </p>
              {order?.fulfillment_error && !order.fulfilled_at ? (
                <p className="mt-2 text-sm text-red-300">{order.fulfillment_error}</p>
              ) : null}
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
            <h1 className="font-display text-3xl italic text-[#F6E7A1]">Нет отчёта</h1>
            <p className="mt-4 text-white/70">
              {error || "Пройди онбординг и оплати разбор — он появится в этом кабинете."}
            </p>
            <Link
              href="/onboarding/insight/"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#F6E7A1] px-10 py-2.5 font-grotesk text-lg font-medium text-[#0a1a3a]"
            >
              К разбору
            </Link>
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
