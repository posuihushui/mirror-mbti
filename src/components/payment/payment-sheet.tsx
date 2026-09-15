"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, Check, CircleNotch, WechatLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { PrimaryButton } from "@/components/site/primary-button";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { currencyFor, paymentTypeOf, priceLabelToMinor, reportCommerce } from "@/lib/analytics/commerce";
import { trackAttrs } from "@/lib/analytics/events";
import { track, trackPurchase } from "@/lib/analytics/track";
import { useMediaQuery } from "@/hooks/use-media-query";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import { cryptoMessages } from "@/lib/i18n/messages/crypto";
import type { CryptoNetwork, OrderView, PaymentPayload } from "@/lib/payments/types";
import { unlockBulletsFor, type PaymentMode } from "@/lib/site";
import { isWeChat } from "@/lib/ua";

// The stablecoin checkout (viem, wallet discovery) ships only to buyers who open it.
const CryptoPayment = dynamic(() => import("@/components/payment/crypto-payment").then((m) => m.CryptoPayment), {
  ssr: false,
  loading: () => <p role="status" className="mt-5 text-[11px] text-mist">{cryptoMessages.loading}</p>,
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string;
  type: string;
  name: string;
  priceLabel: string;
  mode: PaymentMode;
  /** Crypto mode: the networks the server has configured. */
  networks?: CryptoNetwork[];
  onUnlocked: () => void;
  onRead: () => void;
};

type PayState = "ready" | "processing" | "success" | "cancelled";
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

declare global {
  interface Window {
    WeixinJSBridge?: { invoke: (name: string, params: unknown, cb: (res: { err_msg: string }) => void) => void };
  }
}

const MIN_PROCESSING_MS = 900;
const POLL_MS = 2000;

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    const err = new Error(json.error.message) as Error & { code?: string };
    err.code = json.error.code;
    throw err;
  }
  return json.data;
}

/**
 * Payment flow for the full report. In `mock` mode it reproduces the prototype exactly
 * (simulated unlock, no charge). In `wechat` mode it runs JSAPI / H5 / Native depending
 * on the environment and polls the order until the callback lands.
 */
export function PaymentSheet({ open, onOpenChange, ...flow }: Props) {
  const t = paymentMessages[useLocale()].sheet;
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={t.title} description={t.description}>
      {open && <PaymentFlow onOpenChange={onOpenChange} {...flow} />}
    </ResponsiveSheet>
  );
}

const noopSubscribe = () => () => {};

/** Mounted only while the sheet is open, so every open starts from "ready" without effects. */
function PaymentFlow({ onOpenChange, resultId, type, name, priceLabel, mode, networks = [], onUnlocked, onRead }: Omit<Props, "open">) {
  const locale = useLocale();
  const messages = paymentMessages[locale];
  const t = messages.sheet;
  const compact = useMediaQuery("(max-width: 720px)", true);
  const inWeChat = useSyncExternalStore(noopSubscribe, () => isWeChat(navigator.userAgent), () => false);
  const [state, setState] = useState<PayState>("ready");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const checkoutTracked = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  // Every opening of the sheet is a checkout, whether from the unlock button or a `?unlock=1` link.
  useEffect(() => {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    track("begin_checkout", { ...reportCommerce(currencyFor(locale), priceLabelToMinor(priceLabel)), payment_mode: mode });
  }, [locale, priceLabel, mode]);

  function stopPolling() {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  const succeed = () => {
    stopPolling();
    setState("success");
    onUnlocked();
  };

  const purchased = (order: OrderView) => {
    void trackPurchase(order);
    succeed();
  };

  const failed = (errorCode: string) => {
    track("payment_error", { payment_mode: mode, error_code: errorCode });
    setState("cancelled");
  };

  const pollUntilPaid = (orderId: string) => {
    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const order = await api<OrderView>(`/api/orders/${orderId}`);
        if (order.status === "paid") return purchased(order);
        if (order.status === "expired" || order.status === "cancelled" || order.status === "failed") {
          failed(`ORDER_${order.status.toUpperCase()}`);
          return;
        }
      } catch {
        /* transient: keep polling */
      }
      pollRef.current = window.setTimeout(tick, POLL_MS);
    };
    pollRef.current = window.setTimeout(tick, POLL_MS);
  };

  const runMock = async (order: OrderView, startedAt: number) => {
    const paid = await api<OrderView>(`/api/orders/${order.id}/mock-pay`, { method: "POST" });
    const remaining = MIN_PROCESSING_MS - (Date.now() - startedAt);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
    if (cancelledRef.current) return;
    if (paid.status === "paid") purchased(paid);
    else failed(`ORDER_${paid.status.toUpperCase()}`);
  };

  const runWeChat = (order: OrderView, payload: PaymentPayload) => {
    if (payload.kind === "jsapi") {
      const bridge = window.WeixinJSBridge;
      if (!bridge) {
        toast(t.openInWeChat);
        failed("NO_WEIXIN_BRIDGE");
        return;
      }
      bridge.invoke("getBrandWCPayRequest", payload.params, (res) => {
        if (res.err_msg === "get_brand_wcpay_request:ok") pollUntilPaid(order.id);
        else if (res.err_msg === "get_brand_wcpay_request:cancel") {
          track("payment_cancel", { payment_mode: mode, stage: "wechat_jsapi" });
          setState("cancelled");
        } else failed("JSAPI_FAIL");
      });
      return;
    }
    if (payload.kind === "native") {
      setQrSvg(payload.qrSvg);
      pollUntilPaid(order.id);
      return;
    }
    if (payload.kind === "h5") {
      track("payment_redirect", { payment_mode: mode, target: "wechat_h5" });
      window.location.href = payload.mwebUrl;
      return;
    }
    failed("UNSUPPORTED_PAYLOAD");
  };

  const pay = async () => {
    if (state === "processing") return;
    const startedAt = Date.now();
    cancelledRef.current = false;
    setState("processing");
    try {
      const order = await api<OrderView>("/api/orders", { method: "POST", body: JSON.stringify({ resultId }) });
      if (cancelledRef.current) return;
      setOrderId(order.id);
      track("add_payment_info", { ...reportCommerce(order.currency, order.amountFen), payment_mode: order.provider, payment_type: paymentTypeOf(order) });
      if (order.provider === "mock") await runMock(order, startedAt);
      else if (order.payload) runWeChat(order, order.payload);
      else failed("NO_PAYLOAD");
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "OPENID_REQUIRED") {
        track("payment_redirect", { payment_mode: mode, target: "wechat_oauth" });
        const back = `${window.location.pathname}?unlock=1`;
        // The route handler 302s to open.weixin.qq.com, so this must be a full navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/api/wechat/oauth?return=${encodeURIComponent(back)}`;
        return;
      }
      if (err.code === "ALREADY_UNLOCKED") {
        succeed();
        return;
      }
      track("payment_error", { payment_mode: mode, error_code: err.code ?? err.name });
      toast(err.message || t.payFailed);
      setState("ready");
    }
  };

  const cancel = () => {
    track("payment_cancel", { payment_mode: mode, stage: state === "processing" ? "processing" : "before_order" });
    if (state === "processing") {
      cancelledRef.current = true;
      stopPolling();
      setState("cancelled");
      return;
    }
    onOpenChange(false);
    toast(t.cancelledToast);
  };

  const scanMode = !inWeChat && !compact;
  const methodTitle = scanMode ? t.methodScan : t.methodWeChat;
  const methodSub = scanMode ? t.methodScanSub : mode === "wechat" && !inWeChat ? t.methodRedirectSub : t.methodInAppSub;

  return (
    <>
      {state === "success" ? (
        <div className="pt-[22px] pb-[15px] text-center md:pt-[35px]">
          <Check size={44} weight="light" className="mx-auto mb-[22px] text-[#748777]" />
          <p className="eyebrow text-[9px] tracking-[0.16em] text-[#8a9a9c]">READY FOR YOU</p>
          <h3 className="mt-[25px] mb-[18px] text-[26px] leading-[1.5] font-normal whitespace-pre-line">{t.readyHeading}</h3>
          <p className="text-[11px] text-[#7e8b91]">{mode === "mock" ? t.demoSuccess : t.paidSuccess}</p>
          <PrimaryButton className="mt-[35px]" onClick={onRead} {...trackAttrs("read_report", "payment_success")}>
            {t.startReading}
          </PrimaryButton>
          {orderId && <div className="mt-6 border-t border-line pt-5"><OrderReceipt orderId={orderId} /></div>}
          <Link href={href(locale, "/my/report")} prefetch={false} className="text-link mt-4 inline-flex min-h-11 items-center" {...trackAttrs("my_report", "payment_success")}>{t.allRecords}</Link>
        </div>
      ) : (
        <div>
          <div className="mt-0 flex items-center justify-between border-b border-line pt-[13px] pb-[22px] md:mt-[10px] md:pt-[26px]">
            <span className="text-[14px] font-medium">
              {type} · {name}
              <small className="mt-2 block text-[10px] font-normal text-[#7c8b93]">{t.productLabel}</small>
            </span>
            <strong className="text-[39px] font-medium tracking-[-2px] md:text-[45px]">
              <small className="mr-1 text-[20px]">{messages.currency}</small>
              {priceLabel}
            </strong>
          </div>
          <ul className="my-[18px] list-none p-0 md:my-[22px]">
            {unlockBulletsFor(locale).map((l) => (
              <li key={l} className="my-3 flex items-center gap-[9px] text-[11px] text-[#5d707a]">
                <Check size={15} className="text-[#8d9c8b]" />
                {l}
              </li>
            ))}
          </ul>
          {mode === "crypto" ? (
            <CryptoPayment
              resultId={resultId}
              networks={networks}
              onPaid={(order) => {
                setOrderId(order.id);
                purchased(order);
              }}
              onAlreadyUnlocked={succeed}
            />
          ) : (
            <>
              {locale === "zh" && (
                <div className="mt-[18px] flex items-center gap-3 rounded-[3px] border border-[#cdd9dc] px-[15px] py-4 md:mt-[25px]">
                  <WechatLogo size={25} weight="fill" className="text-[#299c63]" />
                  <span className="text-[13px] font-medium">
                    {methodTitle}
                    <small className="mt-[5px] block text-[9px] font-normal text-[#7e8d93]">{methodSub}</small>
                  </span>
                  <Check size={17} className="ml-auto" />
                </div>
              )}
              {qrSvg && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="size-[180px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <p className="text-[10px] text-[#7e8d93]">{t.scanHint}</p>
                </div>
              )}
              <p className="mt-[18px] mb-3 text-center text-[10px] text-[#8c775f] md:mt-6">
                {mode === "mock" ? t.demoNote : t.secureNote}
              </p>
              {state === "cancelled" && (
                <p role="status" className="my-[10px] text-[11px] text-[#997c60]">
                  {t.cancelledStatus}
                </p>
              )}
              <Button variant="pill" className="min-h-[54px]" disabled={state === "processing"} onClick={pay}>
                {state === "processing" ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} />
                    {mode === "mock" ? t.demoProcessing : t.waiting}
                  </>
                ) : (
                  <>
                    {mode === "mock" ? t.demoPay(priceLabel) : t.pay(priceLabel)}
                    <ArrowUpRight size={18} />
                  </>
                )}
              </Button>
            </>
          )}
          <button type="button" onClick={cancel} className="block min-h-11 w-full text-center text-[11px] text-[#78888d]">
            {t.notNow}
          </button>
          <p className="mt-[6px] text-center text-[9px] text-[#92a1a6]">{t.oneTime}</p>
          <p className="mt-3 text-[12px] leading-[1.9] text-mist">{t.keepOrder}</p>
          <Link href={href(locale, "/help")} className="text-link mt-2 min-h-11" {...trackAttrs("view_help", "payment_sheet")}>{t.help}</Link>
        </div>
      )}
    </>
  );
}
