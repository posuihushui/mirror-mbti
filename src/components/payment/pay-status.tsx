"use client";

import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/site/primary-button";
import { AccessActions } from "@/components/pairing/access-actions";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { trackAttrs } from "@/lib/analytics/events";
import { track, trackPurchase } from "@/lib/analytics/track";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import type { OrderView } from "@/lib/payments/types";

/** An order paid this recently is the buyer returning from WeChat H5, not a later visit to an old order. */
const RECENT_PAYMENT_MS = 30 * 60 * 1000;

/** Order recovery page body: polls while pending, then routes to the report. */
export function PayStatus({ initial, priceLabel }: { initial: OrderView; priceLabel: string }) {
  const locale = useLocale();
  const messages = paymentMessages[locale];
  const t = messages.status;
  const [order, setOrder] = useState(initial);
  const initialStatus = useRef(initial.status);
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track("pay_status_view", { payment_mode: initial.provider, order_status: initial.status });
  }, [initial.provider, initial.status]);

  useEffect(() => {
    if (order.status !== "paid") return;
    const watched = initialStatus.current === "created";
    const recent = order.paidAt !== null && Date.now() - Date.parse(order.paidAt) < RECENT_PAYMENT_MS;
    if (watched || recent) void trackPurchase(order);
  }, [order]);

  useEffect(() => {
    if (order.status !== "created") return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; data?: OrderView };
        if (!stopped && json.ok && json.data) setOrder(json.data);
      } catch {
        /* retry */
      }
    };
    const timer = window.setInterval(tick, 2000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [order.id, order.status]);

  const pending = order.status === "created";
  const qr = order.payload?.kind === "native" ? order.payload.qrSvg : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <span className="text-sm font-medium">
          {t.productLabel}
          <small className="mt-2 block text-xs font-normal text-mist">{order.provider === "mock" ? t.demoOrder : t.oneTime}</small>
        </span>
        <strong className="text-4xl font-medium tracking-tight">
          <small className="mr-1 text-xl">{messages.currency}</small>
          {priceLabel}
        </strong>
      </div>
      <p className="mt-4 text-xs text-mist">{pairingMessages[locale].feeRule}</p>
      <p role="status" className="mt-6 text-sm text-mist">
        {t.labels[order.status]}
        {pending ? "…" : ""}
      </p>
      {pending && qr && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="size-[200px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="text-xs text-mist">{t.scanHint}</p>
        </div>
      )}
      <div className="mt-8">
        {order.status === "paid" ? (
          <AccessActions resultId={order.resultId} locale={locale} surface="pay_status" />
        ) : (
          <PrimaryButton href={href(locale, `/result/${order.resultId}${pending ? "" : "?unlock=1"}`)} light={pending} {...trackAttrs(pending ? "back_to_result" : "retry_payment", "pay_status")}>
            {pending ? t.backToResult : t.retry}
          </PrimaryButton>
        )}
      </div>
      <p className="mt-4 text-xs text-mist">
        {t.note}
      </p>
      <div className="mt-6 border-t border-line pt-5"><OrderReceipt orderId={order.id} /></div>
      <div className="mt-3 flex flex-col">
        <TextLink href={href(locale, "/my/report")} prefetch={false} {...trackAttrs("my_report", "pay_status")}>{t.allRecords}</TextLink>
        <TextLink href={href(locale, "/help#contact")} {...trackAttrs("view_help", "pay_status")}>{t.help}</TextLink>
      </div>
    </div>
  );
}
