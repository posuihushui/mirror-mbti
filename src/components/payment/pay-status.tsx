"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrimaryButton } from "@/components/site/primary-button";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import type { OrderView } from "@/lib/payments/types";

/** Order recovery page body: polls while pending, then routes to the report. */
export function PayStatus({ initial, priceLabel }: { initial: OrderView; priceLabel: string }) {
  const router = useRouter();
  const locale = useLocale();
  const messages = paymentMessages[locale];
  const t = messages.status;
  const [order, setOrder] = useState(initial);

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
        <span className="text-[14px] font-medium">
          {t.productLabel}
          <small className="mt-2 block text-[10px] font-normal text-[#7c8b93]">{order.provider === "mock" ? t.demoOrder : t.oneTime}</small>
        </span>
        <strong className="text-[39px] font-medium tracking-[-2px]">
          <small className="mr-1 text-[20px]">{messages.currency}</small>
          {priceLabel}
        </strong>
      </div>
      <p role="status" className="mt-6 text-[13px] text-[#4f5c61]">
        {t.labels[order.status]}
        {pending ? "…" : ""}
      </p>
      {pending && qr && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="size-[200px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="text-[10px] text-[#7e8d93]">{t.scanHint}</p>
        </div>
      )}
      <div className="mt-8">
        {order.status === "paid" ? (
          <PrimaryButton onClick={() => router.push(href(locale, `/report/${order.resultId}`))}>{t.readFull}</PrimaryButton>
        ) : (
          <PrimaryButton href={href(locale, `/result/${order.resultId}${pending ? "" : "?unlock=1"}`)} light={pending}>
            {pending ? t.backToResult : t.retry}
          </PrimaryButton>
        )}
      </div>
      <p className="mt-4 text-[10px] leading-[1.8] text-[#829094]">
        {t.note}
      </p>
      <div className="mt-6 border-t border-line pt-5"><OrderReceipt orderId={order.id} /></div>
      <Link href={href(locale, "/my/report")} prefetch={false} className="text-link mt-4 inline-flex min-h-11 items-center">{t.allRecords}</Link>
      <Link href={href(locale, "/help#contact")} className="text-link mt-3 flex min-h-11">{t.help}</Link>
    </div>
  );
}
