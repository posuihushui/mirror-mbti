"use client";

import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, Check, Clock, X, type Icon } from "@phosphor-icons/react";
import { cn } from "cn";
import { PrimaryButton } from "@/components/site/primary-button";
import { AccessActions } from "@/components/pairing/access-actions";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { trackAttrs } from "@/lib/analytics/events";
import { track, trackPurchase } from "@/lib/analytics/track";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import type { OrderView } from "@/lib/payments/types";

/** An order paid this recently is the buyer returning from WeChat H5, not a later visit to an old order. */
const RECENT_PAYMENT_MS = 30 * 60 * 1000;

const icons: Record<OrderView["status"], Icon> = { created: Clock, paid: Check, cancelled: X, failed: X, expired: X, refunded: ArrowCounterClockwise };

/**
 * Order recovery page body: polls while pending, then routes to the report. The order's state is
 * the page's heading, since that is what a buyer returning from a payment app came to learn.
 */
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
  const paid = order.status === "paid";
  const qr = order.payload?.kind === "native" ? order.payload.qrSvg : null;
  const StatusIcon = icons[order.status];
  // 请 TA: the order covers someone else's report, so it leads back to the invitations, not a result.
  const g = pairingUiMessages[locale].gift;
  const gift = order.kind === "pair-gift";
  const center = href(locale, "/my/pairing");

  return (
    <div>
      <div role="status" className="flex items-start gap-4">
        <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-full", paid ? "bg-warm/20 text-warm-ink" : "bg-paper text-mist")}>
          <StatusIcon size={22} weight={paid ? "bold" : "regular"} />
        </span>
        <div className="min-w-0 pt-1.5">
          <h1 className="text-2xl leading-heading">{gift && paid ? g.statusPaid : t.labels[order.status]}</h1>
          <p className="mt-2 text-sm text-mist">{gift && paid ? g.readyBody : t.detail[order.status]}</p>
        </div>
      </div>
      {pending && qr && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="size-[200px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="text-xs text-mist">{t.scanHint}</p>
        </div>
      )}
      <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-5">
        <span className="text-sm font-medium">
          {gift ? g.product : t.productLabel}
          <small className="mt-1 block text-xs font-normal text-mist">{order.provider === "mock" ? t.demoOrder : t.oneTime}</small>
        </span>
        <strong className="shrink-0 text-2xl font-medium tracking-tight">
          <small className="mr-1 text-base">{messages.currency}</small>
          {priceLabel}
        </strong>
      </div>
      <p className="mt-3 text-xs text-mist">{gift ? g.terms : pairingMessages[locale].feeRule}</p>
      <div className="mt-6">
        {/* While payment is pending, going back is secondary; after a failed payment, retrying is the action. */}
        {gift ? (
          paid ? <PrimaryButton href={center} {...trackAttrs("my_pairing", "pay_status")}>{g.backToCenter}</PrimaryButton>
            : pending ? <TextLink href={center} {...trackAttrs("my_pairing", "pay_status")}>{g.backToCenter}</TextLink>
              : <PrimaryButton href={`${center}?gift=${order.invitationId}`} {...trackAttrs("retry_payment", "pay_status")}>{t.retry}</PrimaryButton>
        ) : paid ? (
          <AccessActions resultId={order.resultId} locale={locale} surface="pay_status" />
        ) : pending ? (
          <TextLink href={href(locale, `/result/${order.resultId}`)} {...trackAttrs("back_to_result", "pay_status")}>{t.backToResult}</TextLink>
        ) : (
          <PrimaryButton href={href(locale, `/result/${order.resultId}?unlock=1`)} {...trackAttrs("retry_payment", "pay_status")}>
            {t.retry}
          </PrimaryButton>
        )}
      </div>
      {!paid && <p className="mt-4 text-xs text-mist">{t.note}</p>}
      <div className="mt-6 border-t border-line pt-5"><OrderReceipt orderId={order.id} /></div>
      <div className="mt-3 flex flex-col">
        <TextLink href={href(locale, "/my/report")} prefetch={false} {...trackAttrs("my_report", "pay_status")}>{t.allRecords}</TextLink>
        <TextLink href={href(locale, "/help#contact")} {...trackAttrs("view_help", "pay_status")}>{t.help}</TextLink>
      </div>
    </div>
  );
}
