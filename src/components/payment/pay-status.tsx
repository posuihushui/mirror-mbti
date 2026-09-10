"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrimaryButton } from "@/components/site/primary-button";
import { OrderReceipt } from "@/components/payment/order-receipt";
import type { OrderView } from "@/lib/payments/types";

const LABELS: Record<OrderView["status"], string> = {
  created: "正在等待支付确认",
  paid: "支付成功，报告已解锁",
  cancelled: "支付已取消",
  failed: "支付未完成",
  expired: "订单已超时",
  refunded: "订单已退款",
};

/** Order recovery page body: polls while pending, then routes to the report. */
export function PayStatus({ initial, priceLabel }: { initial: OrderView; priceLabel: string }) {
  const router = useRouter();
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
    const t = window.setInterval(tick, 2000);
    return () => {
      stopped = true;
      window.clearInterval(t);
    };
  }, [order.id, order.status]);

  const pending = order.status === "created";
  const qr = order.payload?.kind === "native" ? order.payload.qrSvg : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <span className="text-[14px] font-medium">
          完整人格报告
          <small className="mt-2 block text-[10px] font-normal text-[#7c8b93]">{order.provider === "mock" ? "演示订单 · 本次不会扣款" : "单次购买"}</small>
        </span>
        <strong className="text-[39px] font-medium tracking-[-2px]">
          <small className="mr-1 text-[20px]">¥</small>
          {priceLabel}
        </strong>
      </div>
      <p role="status" className="mt-6 text-[13px] text-[#4f5c61]">
        {LABELS[order.status]}
        {pending ? "…" : ""}
      </p>
      {pending && qr && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="size-[200px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="text-[10px] text-[#7e8d93]">请使用微信「扫一扫」完成支付。</p>
        </div>
      )}
      <div className="mt-8">
        {order.status === "paid" ? (
          <PrimaryButton onClick={() => router.push(`/report/${order.resultId}`)}>阅读完整报告</PrimaryButton>
        ) : (
          <PrimaryButton href={`/result/${order.resultId}${pending ? "" : "?unlock=1"}`} light={pending}>
            {pending ? "返回我的性格画像" : "重新发起支付"}
          </PrimaryButton>
        )}
      </div>
      <p className="mt-4 text-[10px] leading-[1.8] text-[#829094]">
        支付成功但报告未解锁时，请保留订单编号并联系我们；系统也会在收到支付结果后自动为你解锁。
      </p>
      <div className="mt-6 border-t border-line pt-5"><OrderReceipt orderId={order.id} /></div>
      <Link href="/my/report" prefetch={false} className="text-link mt-4 inline-flex min-h-11 items-center">查看全部测试记录</Link>
    </div>
  );
}
