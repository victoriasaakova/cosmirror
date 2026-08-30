"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { InteractiveReport } from "@/components/InteractiveReport";
import { AccountSettings } from "@/components/AccountSettings";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/components/AuthProvider";
import {
  completeMyDemoOrder,
  confirmMyPayment,
  checkoutReturnParamsFromSearch,
  downloadMyReportPdf,
  fetchMyOrder,
  reportGeneratingLayer,
  reportLayersPending,
  reportLlmLayerIds,
  reportReadyToOpen,
  type Order,
  type PaidReportLayerId,
} from "@/lib/api";
import { writeAuthToken } from "@/lib/auth";
import { captureEvent } from "@/lib/posthog-client";
import { freshOnboardingHref } from "@/lib/onboarding/paths";
import { greetingName } from "@/lib/user-name";
import { PRELOADER_LEDE, StarCheckPreloader, StarCheckPreloaderPage } from "@/components/StarCheckPreloader";

function orderChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel("cosmirror-account-report");
  } catch {
    return null;
  }
}

function previewMode(
  raw: string | null,
): "pay" | "bank" | "report" | "empty" | "failed" | "auth" | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (raw === "pay" || raw === "waiting") return "pay";
  if (raw === "bank" || raw === "waiting-bank") return "bank";
  if (raw === "report" || raw === "generating") return "report";
  if (raw === "empty" || raw === "cabinet") return "empty";
  if (raw === "failed" || raw === "fail") return "failed";
  if (raw === "auth" || raw === "login") return "auth";
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

function ReportInner({ initialSection }: { initialSection?: "account" }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, ready, refresh, startLogin } = useAuth();
  const fromProdamus =
    searchParams.get("from") === "prodamus" || isCheckoutReturnPath(pathname);
  const preview = previewMode(searchParams.get("preview"));
  const accountOpen =
    initialSection === "account" ||
    pathname === "/account/settings" ||
    pathname === "/account/settings/" ||
    searchParams.get("s") === "account";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [cabinetEmpty, setCabinetEmpty] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState("");
  const [checkoutReturned, setCheckoutReturned] = useState(fromProdamus);
  const [paymentSlow, setPaymentSlow] = useState(false);
  const paidCaptured = useRef(false);
  const isLocalDemo = process.env.NODE_ENV === "development";
  const unpaidLocal =
    isLocalDemo &&
    Boolean(order) &&
    order?.status !== "paid" &&
    order?.status !== "canceled" &&
    order?.status !== "denied";

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const auth = params.get("auth") || "";
    if (!auth) {
      setBootstrapped(true);
      return;
    }
    writeAuthToken(auth);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    void refresh().finally(() => setBootstrapped(true));
  }, [refresh]);

  useEffect(() => {
    if (!order || order.status !== "paid" || paidCaptured.current) return;
    paidCaptured.current = true;
    captureEvent("payment_completed", { order_id: order.id });
  }, [order]);

  useEffect(() => {
    if (preview) return;
    if (!bootstrapped || !ready) return;
    if (!user) {
      setNeedsAuth(true);
      setCabinetEmpty(false);
      setError("Войди через Яндекс ID, чтобы открыть кабинет.");
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
          setCabinetEmpty(false);
          setError("");
        }
      };
    }

    const startedAt = Date.now();
    let timer = 0;

    function delayFor(errored: boolean) {
      const elapsed = Date.now() - startedAt;
      if (errored) return elapsed > 60_000 ? 10_000 : 4_000;
      // Paid generating used to stay at 2s forever — that is the Network "infinite report/" loop.
      if (elapsed > 12 * 60_000) return 30_000;
      if (elapsed > 180_000) return 15_000;
      if (elapsed > 90_000) return 8_000;
      if (elapsed > 30_000) return 4_000;
      return 2_000;
    }

    async function poll() {
      try {
        const next = await fetchMyOrder();
        if (cancelled) return;
        setError("");
        setNeedsAuth(false);
        if (!next) {
          if (fromProdamus || checkoutReturned) {
            setCabinetEmpty(false);
            if (Date.now() - startedAt > 90_000) setPaymentSlow(true);
            timer = window.setTimeout(() => {
              void poll();
            }, delayFor(false));
            return;
          }
          setOrder(null);
          setCabinetEmpty(true);
          return;
        }
        setOrder(next);
        setCabinetEmpty(false);
        if (next.status === "paid") {
          channel?.postMessage({ type: "order", order: next });
          setPaymentSlow(false);
        } else if (Date.now() - startedAt > 90_000) {
          setPaymentSlow(true);
        }
        if (next.status === "canceled" || next.status === "denied") {
          return;
        }
        const awaitingLlm =
          next.status === "paid" &&
          Boolean(next.report) &&
          reportLayersPending(next.report);
        if (next.status === "paid" && next.report && !awaitingLlm) {
          return;
        }
        timer = window.setTimeout(() => {
          void poll();
        }, delayFor(false));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Не удалось проверить оплату";
        if (message.toLowerCase().includes("яндекс")) {
          setNeedsAuth(true);
          setCabinetEmpty(false);
        }
        setError(message);
        timer = window.setTimeout(() => {
          void poll();
        }, delayFor(true));
      }
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      channel?.close();
    };
  }, [bootstrapped, checkoutReturned, fromProdamus, preview, ready, user]);

  useEffect(() => {
    if (preview) return;
    if (!bootstrapped || !ready || !user) return;
    const params = checkoutReturnParamsFromSearch(searchParams);
    if (!fromProdamus && params.payform_status !== "success") return;
    let cancelled = false;
    void confirmMyPayment(params)
      .then((next) => {
        if (cancelled || !next) return;
        setOrder(next);
        setCabinetEmpty(false);
        setError("");
        if (next.status === "paid") setPaymentSlow(false);
        try {
          const channel = orderChannel();
          channel?.postMessage({ type: "order", order: next });
          channel?.close();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* poll / webhook подхватят */
      });
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, fromProdamus, preview, ready, searchParams, user]);

  useEffect(() => {
    if (!isLocalDemo || preview) return;
    if (!fromProdamus && !checkoutReturned) return;
    let cancelled = false;
    void completeMyDemoOrder()
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setCabinetEmpty(false);
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
          setCabinetEmpty(false);
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

  async function onDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    setDownloadNote("");
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
      setDownloadNote(err instanceof Error ? err.message : "Не удалось скачать PDF");
    } finally {
      setDownloading(false);
    }
  }

  const failed =
    preview === "failed" || order?.status === "canceled" || order?.status === "denied";
  const confirmed = order?.status === "paid";
  const report = confirmed ? order?.report : null;
  const showReport = Boolean(report && reportReadyToOpen(report));
  const waitingAuth = !preview && (!bootstrapped || !ready);
  const waitingBank =
    preview === "bank" ||
    (!preview &&
      !needsAuth &&
      !failed &&
      !confirmed &&
      !cabinetEmpty &&
      checkoutReturned);
  const generating =
    preview === "report" ||
    (!preview && !needsAuth && !failed && confirmed && !showReport);
  const generatingLayer: PaidReportLayerId | "" =
    preview === "report" ? "natal" : reportGeneratingLayer(report);
  const generatingDone = preview === "report" ? [] : reportLlmLayerIds(report);
  const waitingPayment =
    preview === "pay" ||
    (!preview && Boolean(order) && !failed && !confirmed && !checkoutReturned);
  const emptyCabinet =
    preview === "empty" ||
    (!preview && !needsAuth && !waitingAuth && cabinetEmpty && !fromProdamus);
  const showNeedsAuth = preview === "auth" || (!preview && needsAuth);
  const loading =
    !preview &&
    !needsAuth &&
    !order &&
    !error &&
    !cabinetEmpty &&
    !checkoutReturned &&
    (waitingAuth || Boolean(user));
  const isStatus =
    !accountOpen &&
    (waitingAuth ||
      loading ||
      waitingBank ||
      generating ||
      waitingPayment ||
      emptyCabinet ||
      showNeedsAuth ||
      failed);

  async function reloadOrder() {
    await refresh();
    try {
      const next = await fetchMyOrder();
      setOrder(next);
      setCabinetEmpty(!next);
    } catch {
      /* keep current order on screen */
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[var(--background)] text-[var(--foreground)]">
      <Header />
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

      <div
        className="relative z-10 mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pt-[var(--cabinet-header-offset)] pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:max-w-[68rem] lg:px-8"
      >
        {showNeedsAuth ? (
          <StatusScreen titleBefore="открой" titleAccent="кабинет">
            <p className="report-lede mt-4">
              {error || "войди через Яндекс ID — здесь будет твоя карта."}
            </p>
            <button
              type="button"
              className="cabinet-cta mt-10"
              onClick={() => void startLogin("/account/")}
            >
              Войти
            </button>
          </StatusScreen>
        ) : accountOpen && user ? (
          <div className="mt-4 min-w-0 pb-8 sm:mt-6 lg:pb-16">
            <AccountSettings onSaved={() => void reloadOrder()} />
          </div>
        ) : waitingAuth || loading ? (
          <StarCheckPreloader />
        ) : emptyCabinet ? (
          <StatusScreen titleBefore="здесь будет" titleAccent="твоя карта">
            <p className="report-lede mt-4">
              пройди короткий путь — соберём персональный разбор и сохраним его в кабинете.
            </p>
            <Link href={freshOnboardingHref()} className="cabinet-cta mt-10">
              Начать путешествие
            </Link>
          </StatusScreen>
        ) : waitingBank ? (
          <StatusScreen titleBefore="ожидаем оплату" titleAccent="от банка" showEye>
            <p className={PRELOADER_LEDE}>
              {paymentSlow
                ? "банк подтверждает дольше обычного. не закрывай страницу — отчёт соберём сразу после оплаты."
                : "банк ещё подтверждает платёж. не закрывай страницу — отчёт соберём сразу после этого."}
            </p>
          </StatusScreen>
        ) : generating ? (
          <StatusScreen titleBefore="отчёт" titleAccent="формируется" showEye>
            <p className={PRELOADER_LEDE}>
              {GENERATING_COPY[generatingLayer || "natal"]}
              <br />
              не закрывай страницу — разбор откроется здесь, как только тексты будут готовы.
            </p>
            <GeneratingSteps current={generatingLayer || "natal"} done={generatingDone} />
          </StatusScreen>
        ) : waitingPayment ? (
          <StatusScreen titleBefore="остался один" titleAccent="шаг">
            <p className="report-lede mt-4">
              {error ||
                "оплати заказ на защищённой странице Prodamus. после оплаты разбор откроется здесь"}
            </p>
            {order?.payment_url || preview === "pay" ? (
              <a
                href={order?.payment_url || "#"}
                target={order?.payment_url ? "cosmirror-prodamus" : undefined}
                rel="noopener noreferrer"
                className="cabinet-cta mt-10"
              >
                К оплате
              </a>
            ) : null}
            {isLocalDemo ? (
              <p className="report-lede mt-5 max-w-sm text-base">
                на localhost после оплаты смотри эту вкладку. Prodamus не умеет вернуться на
                http://localhost — кнопка «в магазин» откроет https и упадёт.
              </p>
            ) : null}
          </StatusScreen>
        ) : failed ? (
          <StatusScreen titleBefore="оплата не" titleAccent="прошла">
            <p className="report-lede mt-4">
              Платёж отменили или банк его отклонил. Вернись к разбору и нажми оплату ещё раз.
            </p>
            <Link href="/onboarding/insight/" className="cabinet-cta mt-10">
              Вернуться к разбору
            </Link>
          </StatusScreen>
        ) : showReport && report ? (
          <article className="mt-4 min-w-0 pb-8 sm:mt-6 lg:pb-16">
            <InteractiveReport
              report={report}
              displayName={greetingName(user)}
              orderId={order?.id}
              downloading={downloading}
              onDownloadPdf={() => void onDownloadPdf()}
              actionNote={downloadNote}
            />
          </article>
        ) : (
          <StatusScreen titleBefore="здесь будет" titleAccent="твоя карта">
            <p className="report-lede mt-4">
              {error || "пройди короткий путь — соберём персональный разбор и сохраним его в кабинете."}
            </p>
            <Link href={freshOnboardingHref()} className="cabinet-cta mt-10">
              Начать путешествие
            </Link>
          </StatusScreen>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

const GENERATING_STEPS: { id: PaidReportLayerId; label: string }[] = [
  { id: "natal", label: "карта" },
  { id: "aspects", label: "аспекты" },
  { id: "cycles", label: "циклы" },
  { id: "request", label: "запрос" },
  { id: "practice", label: "практика" },
];

const GENERATING_COPY: Record<PaidReportLayerId, string> = {
  natal: "читаю твою карту — как устроен характер и на чём ты опираешься.",
  aspects: "собираю аспекты — как планеты в карте связаны друг с другом.",
  cycles: "смотрю текущие циклы — что сейчас давит и что поддерживает.",
  request: "связываю карту с тем, с чем ты пришла.",
  practice: "собираю практику — с чего начать в ближайшие дни.",
};

function GeneratingSteps({
  current,
  done,
}: {
  current: PaidReportLayerId;
  done: PaidReportLayerId[];
}) {
  return (
    <ol className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm tracking-wide">
      {GENERATING_STEPS.map((step) => {
        const isCurrent = step.id === current;
        const isDone = done.includes(step.id);
        return (
          <li
            key={step.id}
            className={
              isCurrent
                ? "text-[#F6E7A1]"
                : isDone
                  ? "text-white"
                  : "text-white/35"
            }
          >
            {step.label}
          </li>
        );
      })}
    </ol>
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
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center"
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
        className={`text-3xl font-normal leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.6rem] ${
          showEye ? "mt-8" : ""
        }`}
      >
        {titleBefore ? (
          <>
            {titleBefore}{" "}
            <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">{titleAccent}</span>
          </>
        ) : (
          <span className="font-display inline-block pb-1 italic leading-[1.15] text-[#F6E7A1]">{titleAccent}</span>
        )}
      </h1>
      {children}
    </div>
  );
}

export function ReportPage({ initialSection }: { initialSection?: "account" } = {}) {
  return (
    <Suspense fallback={<StarCheckPreloaderPage />}>
      <ReportInner initialSection={initialSection} />
    </Suspense>
  );
}
