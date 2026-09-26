import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { PayStatus } from "@/components/payment/pay-status";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { getOrder, refreshOrder, toOrderView } from "@/lib/orders";
import { questionnaireLocale } from "@/lib/questionnaires";
import { getResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { formatPriceFen } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: pageMessages[locale].pay.title, robots: { index: false, follow: false } };
}

/** Landing page after H5 payment and the recovery page for any order. Owner-only. */
export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const locale = await getLocale();
  const t = pageMessages[locale].pay;
  const visitorId = await getVisitorId();
  const order = visitorId ? await getOrder(orderId, visitorId) : null;
  if (!order) notFound();
  // The order page speaks the language (and currency) of the result it unlocks.
  const result = await getResult(order.resultId, visitorId);
  const orderLocale = result ? questionnaireLocale(result.questionnaireId) : locale;
  if (orderLocale !== locale) redirect(href(orderLocale, `/pay/${orderId}`));
  const fresh = await refreshOrder(order);
  return (
    <>
      <AppHeader variant="page" title={t.title} backHref={href(locale, order.kind === "pair-gift" ? "/my/pairing" : `/result/${order.resultId}`)} />
      <main className="mx-auto max-w-lg px-6 pt-6 pb-20 md:pt-14">
        <section className="border border-line bg-card px-6 py-7 md:px-8 md:py-8">
          <PayStatus initial={toOrderView(fresh)} priceLabel={formatPriceFen(fresh.amountFen)} />
        </section>
      </main>
    </>
  );
}
