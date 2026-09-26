"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, ArrowUpRight, Check, CircleNotch, CreditCard, WechatLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { Button } from "@/components/ui/button";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { TextLink } from "@/components/site/text-link";
import { currencyFor, giftCommerce, orderCommerce, paymentTypeOf, priceLabelToMinor, reportCommerce } from "@/lib/analytics/commerce";
import { AccessActions } from "@/components/pairing/access-actions";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { emitPairingEvent } from "@/lib/pairing-tracking";
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
import { TypeName } from "@/components/result/type-name";

// The stablecoin checkout (viem, wallet discovery) ships only to buyers who open it.
const CryptoPayment = dynamic(() => import("@/components/payment/crypto-payment").then((m) => m.CryptoPayment), {
  ssr: false,
  loading: () => <p role="status" className="mt-5 text-xs text-mist">{cryptoMessages.loading}</p>,
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
  initiallyUnlocked?: boolean;
  /**
   * 请 TA: sell a gift for one of the host's invitations instead of the report for `resultId`
   * (the host's own result, which the invitation was made from).
   */
  gift?: { invitationId: string; /** The success button, when the sheet was opened somewhere other than the pairing center. */ backLabel?: string };
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
  const locale = useLocale();
  const t = paymentMessages[locale].sheet;
  const g = pairingUiMessages[locale].gift;
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={flow.gift ? g.sheetTitle : t.title} description={flow.gift ? g.description : t.description}>
      {open && <PaymentFlow onOpenChange={onOpenChange} {...flow} />}
    </ResponsiveSheet>
  );
}

const noopSubscribe = () => () => {};

/** Mounted only while the sheet is open, so every open starts from "ready" without effects. */
function PaymentFlow({ onOpenChange, resultId, type, name, priceLabel, mode, networks = [], onUnlocked, initiallyUnlocked = false, gift }: Omit<Props, "open">) {
  const locale = useLocale();
  const messages = paymentMessages[locale];
  const t = messages.sheet;
  const g = pairingUiMessages[locale].gift;
  const orderBody: Record<string, string> = gift ? { kind: "pair-gift", invitationId: gift.invitationId } : { resultId };
  const compact = useMediaQuery("(max-width: 720px)", true);
  const inWeChat = useSyncExternalStore(noopSubscribe, () => isWeChat(navigator.userAgent), () => false);
  const [state, setState] = useState<PayState>(initiallyUnlocked ? "success" : "ready");
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
    if (checkoutTracked.current || initiallyUnlocked) return;
    checkoutTracked.current = true;
    // The pairing funnel counts report checkouts; a gift is the host paying for someone else.
    if (!gift) emitPairingEvent("pairing_checkout_opened", resultId, "payment_sheet");
    track("begin_checkout", { ...(gift ? giftCommerce : reportCommerce)(currencyFor(locale), priceLabelToMinor(priceLabel)), payment_mode: mode });
  }, [locale, priceLabel, mode, resultId, initiallyUnlocked, gift]);

  function stopPolling() {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  const succeed = () => {
    stopPolling();
    setState("success");
    // A report reports readiness through AccessActions; a gift is ready as soon as it is paid.
    if (gift) onUnlocked();
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

  /** Hosted card checkout: the buyer finishes at Waffo and returns to `/pay/[orderId]`. */
  const runCard = (payload: Extract<PaymentPayload, { kind: "redirect" }>) => {
    track("payment_redirect", { payment_mode: mode, target: "waffo_checkout" });
    window.location.href = payload.url;
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
      const order = await api<OrderView>("/api/orders", { method: "POST", body: JSON.stringify(orderBody) });
      if (cancelledRef.current) return;
      setOrderId(order.id);
      track("add_payment_info", { ...orderCommerce(order), payment_mode: order.provider, payment_type: paymentTypeOf(order) });
      if (order.provider === "mock") await runMock(order, startedAt);
      else if (order.payload?.kind === "redirect") runCard(order.payload);
      else if (order.payload) runWeChat(order, order.payload);
      else failed("NO_PAYLOAD");
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "OPENID_REQUIRED") {
        track("payment_redirect", { payment_mode: mode, target: "wechat_oauth" });
        const back = gift ? `${window.location.pathname}?gift=${gift.invitationId}` : `${window.location.pathname}?unlock=1`;
        // The route handler 302s to open.weixin.qq.com, so this must be a full navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/api/wechat/oauth?return=${encodeURIComponent(back)}`;
        return;
      }
      if (err.code === "ALREADY_UNLOCKED" || err.code === "PAIRING_ENTITLEMENT_SYNCING" || err.code === "GIFT_ALREADY_COVERED") {
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
      {state === "success" && gift ? (
        <div className="pt-5 pb-4 text-center md:pt-8" data-gift-ready>
          <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-warm text-ink"><Check size={24} weight="bold" /></span>
          <h3 className="mb-3 text-3xl leading-heading font-normal">{g.ready}</h3>
          <p className="text-sm text-mist">{g.readyBody}</p>
          {orderId && <div className="mt-6 border-t border-line pt-5 text-left"><OrderReceipt orderId={orderId} /></div>}
          <button type="button" onClick={() => onOpenChange(false)} className="pill mt-6 min-h-11">{gift.backLabel ?? g.backToCenter}<ArrowRight size={18} /></button>
        </div>
      ) : state === "success" ? (
        <div className="pt-5 pb-4 text-center md:pt-8">
          <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-warm text-ink"><Check size={24} weight="bold" /></span>
          <p className="eyebrow text-mist">{t.readyEyebrow}</p>
          <h3 className="mt-4 mb-3 text-3xl leading-heading font-normal whitespace-pre-line">{t.readyHeading}</h3>
          {mode !== "mock" && <p className="text-sm text-mist">{t.paidSuccess}</p>}
          <AccessActions resultId={resultId} locale={locale} surface="payment_sheet" onReady={onUnlocked} />
          {orderId && <div className="mt-6 border-t border-line pt-5 text-left"><OrderReceipt orderId={orderId} /></div>}
          <TextLink href={href(locale, "/my/report")} prefetch={false} className="mt-3" {...trackAttrs("my_report", "payment_success")}>{t.allRecords}</TextLink>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 border-b border-line pt-3 pb-5 md:pt-6">
            <span className="min-w-0 text-base font-medium">
              {gift ? g.product : <TypeName name={`${type} · ${name}`} />}
              <small className="mt-1 block text-xs font-normal text-mist">{gift ? pairingMessages[locale].title : t.productLabel}</small>
            </span>
            <strong className="shrink-0 text-4xl font-medium tracking-tight md:text-5xl">
              <small className="mr-1 text-xl">{messages.currency}</small>
              {priceLabel}
            </strong>
          </div>
          {/* What the reader gets comes first; the purchase terms follow as one quiet paragraph. */}
          <ul className="mt-5 list-none space-y-2.5 p-0">
            {(gift ? g.bullets : unlockBulletsFor(locale)).map((l) => (
              <li key={l} className="flex items-start gap-3 text-base">
                <Check size={17} className="mt-1 shrink-0 text-warm-ink" />
                {l}
              </li>
            ))}
          </ul>
          {/* Said once: no subscription, each person unlocks their own report, the guide waits for consent. */}
          <p className="mt-5 text-xs text-mist">{gift ? g.terms : `${t.terms} ${pairingMessages[locale].feeRule} ${pairingMessages[locale].delayedGeneration}`}</p>
          {mode === "crypto" ? (
            <CryptoPayment
              orderBody={orderBody}
              networks={networks}
              onPaid={(order) => {
                setOrderId(order.id);
                purchased(order);
              }}
              onAlreadyUnlocked={succeed}
            />
          ) : (
            <>
              {(locale === "zh" || mode === "waffo") && (
                <div className="mt-5 flex items-center gap-3 rounded-[3px] border border-line bg-card px-4 py-3.5">
                  {mode === "waffo" ? <CreditCard size={25} weight="light" /> : <WechatLogo size={25} weight="fill" className="text-[#299c63]" />}
                  <span className="text-sm font-medium">
                    {mode === "waffo" ? t.methodCard : methodTitle}
                    <small className="mt-1 block text-xs font-normal text-mist">{mode === "waffo" ? t.methodCardSub : methodSub}</small>
                  </span>
                  <Check size={17} className="ml-auto" />
                </div>
              )}
              {qrSvg && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="size-[180px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <p className="text-xs text-mist">{t.scanHint}</p>
                </div>
              )}
              {mode !== "mock" && (
                <p className="mt-5 mb-3 text-center text-xs text-warm-ink">
                  {mode === "waffo" ? t.cardSecureNote : t.secureNote}
                </p>
              )}
              {state === "cancelled" && (
                <p role="status" className="my-2 text-sm text-warm-ink">
                  {t.cancelledStatus}
                </p>
              )}
              {/* Mock mode has no payment note above, so the button keeps that gap itself. */}
              <Button variant="pill" className={mode === "mock" ? "mt-5 min-h-[54px]" : "min-h-[54px]"} disabled={state === "processing"} onClick={pay}>
                {state === "processing" ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} />
                    {mode === "mock" ? t.mockProcessing : t.waiting}
                  </>
                ) : (
                  <>
                    {mode === "mock" ? t.mockPay(priceLabel) : mode === "waffo" ? t.payCard(priceLabel) : t.pay(priceLabel)}
                    {/* ↗ only for the hosted card checkout, which leaves the site. */}
                    {mode === "waffo" ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />}
                  </>
                )}
              </Button>
            </>
          )}
          <button type="button" onClick={cancel} className="mt-1 block min-h-11 w-full text-center text-sm text-mist hover:text-ink">
            {t.notNow}
          </button>
          {mode === "waffo" && (
            <p className="mt-3 text-xs text-mist">
              {t.cardTaxNote} {t.cardRefundNote}
            </p>
          )}
          <p className="mt-3 text-xs text-mist">{t.keepOrder}</p>
          <TextLink href={href(locale, "/help")} className="mt-1" {...trackAttrs("view_help", "payment_sheet")}>{t.help}</TextLink>
        </div>
      )}
    </>
  );
}
