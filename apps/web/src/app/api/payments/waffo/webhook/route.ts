import { verifyWebhook, WebhookEventType, type WebhookEvent, type WebhookEventData } from "@waffo/pancake-ts";
import { NextResponse } from "next/server";
import { paymentModeFor } from "@/lib/env";
import { getOrderByIdUnchecked, markOrderPaid, recordPaymentEvent } from "@/lib/orders";
import { amountToCents } from "@/lib/payments/waffo/amounts";
import { waffoConfig } from "@/lib/payments/waffo/config";

const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status });

/** The buyer's email belongs to Waffo, the seller of record; we keep the payment record without it. */
function withoutBuyerEmail(event: WebhookEvent): Record<string, unknown> {
  const data: Partial<WebhookEventData> = { ...event.data };
  delete data.buyerEmail;
  return { ...event, data };
}

/**
 * Waffo Pancake webhook. The SDK verifies the RSA signature over the raw body with the key for our
 * environment; the event is recorded once and the matching order flips to paid. Only
 * `order.completed` grants access; refund events are recorded for the payment history and never
 * revoke a report. Waffo retries on non-2xx.
 */
export async function POST(req: Request) {
  if (paymentModeFor("en") !== "waffo") return fail("provider disabled", 404);
  const config = waffoConfig();

  const body = await req.text();
  let event: WebhookEvent;
  try {
    // Re-serialising parsed JSON would change the bytes, so the SDK gets the body exactly as received.
    event = verifyWebhook<WebhookEventData>(body, req.headers.get("x-waffo-signature"), {
      environment: config.environment,
      publicKeys: config.webhookPublicKey,
    });
  } catch (e) {
    console.error("[waffo webhook] rejected", e instanceof Error ? e.message : e);
    return fail("signature verification failed", 401);
  }

  // Waffo signs every merchant's events with the same platform key, so a valid signature only proves
  // the event came from Waffo. Anyone can point their own store's webhook here with our order id.
  if (event.mode !== config.environment || event.storeId !== config.storeId) {
    console.error("[waffo webhook] event for another store or environment", event.storeId, event.mode);
    return fail("unknown store", 400);
  }

  const data: Partial<WebhookEventData> = event.data ?? {};
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

  if (event.eventType === WebhookEventType.OrderCompleted && data.paymentStatus !== "failed") {
    // The pre-tax list price is what we charged; tax is added on top. `subtotal` is its deprecated name.
    const charged = amountToCents(data.listPrice?.subtotal ?? data.subtotal ?? "");
    if (data.currency !== order.currency || charged === null || charged < order.amountFen) {
      console.error("[waffo webhook] amount mismatch", order.id, data.currency, data.listPrice?.subtotal ?? data.subtotal, order.amountFen);
      return fail("amount mismatch", 400);
    }
    // A callback that arrives after the order expired still unlocks it: the card was already charged.
    // The event may already be recorded if an earlier delivery failed after recording it.
    // Re-run the idempotent transition so Waffo's retry can still grant access.
    await markOrderPaid(order.id, data.paymentId ?? event.eventId, event.timestamp ? new Date(event.timestamp) : new Date(), { allowExpired: true });
  }
  return NextResponse.json({ ok: true });
}
