import { NextResponse } from "next/server";
import { paymentModeFor } from "@/lib/env";
import { getOrderByIdUnchecked, markOrderPaid, recordPaymentEvent } from "@/lib/orders";
import { waffoConfig } from "@/lib/payments/waffo/config";
import { amountToCents, verifyWebhook } from "@/lib/payments/waffo/crypto";

type WaffoEvent = {
  id: string;
  timestamp?: string;
  eventType: string;
  eventId: string;
  mode?: string;
  data?: {
    orderId?: string;
    orderStatus?: string;
    orderMerchantExternalId?: string;
    currency?: string;
    /** Pre-tax amount — what we charged. `total` adds the tax Waffo collects as merchant of record. */
    subtotal?: string;
    total?: string;
    paymentId?: string;
    paymentStatus?: string;
    buyerEmail?: string;
  };
};

const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status });

/** The buyer's email belongs to Waffo, the seller of record; we keep the payment record without it. */
function withoutBuyerEmail(event: WaffoEvent): Record<string, unknown> {
  const data = { ...(event.data ?? {}) };
  delete data.buyerEmail;
  return { ...event, data };
}

/**
 * Waffo Pancake webhook. Verifies the RSA signature over the raw body, records the event once and
 * flips the matching order to paid. Only `order.completed` grants access; refund events are recorded
 * for the payment history and never revoke a report. Waffo retries on non-2xx.
 */
export async function POST(req: Request) {
  if (paymentModeFor("en") !== "waffo") return fail("provider disabled", 404);

  const body = await req.text();
  // The test and production public keys differ, so a verified event always belongs to our environment.
  if (!verifyWebhook(body, req.headers.get("x-waffo-signature"), waffoConfig().webhookPublicKey)) {
    return fail("signature verification failed", 401);
  }

  let event: WaffoEvent;
  try {
    event = JSON.parse(body) as WaffoEvent;
  } catch (e) {
    console.error("[waffo webhook] decode failed", e);
    return fail("bad payload", 400);
  }

  const data = event.data ?? {};
  const order = data.orderMerchantExternalId ? await getOrderByIdUnchecked(data.orderMerchantExternalId) : null;
  // `eventId` identifies the payment or refund, so the type keeps one payment's events apart.
  await recordPaymentEvent({
    orderId: order?.id ?? null,
    provider: "waffo",
    eventId: `${event.eventType}:${event.eventId}`,
    kind: event.eventType,
    raw: withoutBuyerEmail(event),
  });
  if (!order) return fail("unknown order", 404);

  if (event.eventType === "order.completed" && data.paymentStatus !== "failed") {
    const charged = amountToCents(data.subtotal ?? "");
    if (data.currency !== order.currency || charged === null || charged < order.amountFen) {
      console.error("[waffo webhook] amount mismatch", order.id, data.currency, data.subtotal, order.amountFen);
      return fail("amount mismatch", 400);
    }
    // A callback that arrives after the order expired still unlocks it: the card was already charged.
    // The event may already be recorded if an earlier delivery failed after recording it.
    // Re-run the idempotent transition so Waffo's retry can still grant access.
    await markOrderPaid(order.id, data.paymentId ?? event.eventId, event.timestamp ? new Date(event.timestamp) : new Date(), { allowExpired: true });
  }
  return NextResponse.json({ ok: true });
}
