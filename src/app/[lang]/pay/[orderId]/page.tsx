import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { PayStatus } from "@/components/payment/pay-status";
import { priceFen } from "@/lib/env";
import { getOrder, refreshOrder, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";
import { formatPriceFen } from "@/lib/site";

export const metadata: Metadata = { title: "订单状态", robots: { index: false, follow: false } };

/** Landing page after H5 payment and the recovery page for any order. Owner-only. */
export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const visitorId = await getVisitorId();
  const order = visitorId ? await getOrder(orderId, visitorId) : null;
  if (!order) notFound();
  const fresh = await refreshOrder(order);
  return (
    <>
      <AppHeader variant="page" title="订单状态" backHref={`/result/${order.resultId}`} />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-20 md:pt-[60px]">
        <p className="eyebrow text-[#738087]">ORDER</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em]">更完整地，认识自己。</h1>
        <PayStatus initial={toOrderView(fresh)} priceLabel={formatPriceFen(priceFen())} />
      </main>
    </>
  );
}
