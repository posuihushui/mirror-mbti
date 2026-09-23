import "server-only";
import type { OrderRow } from "@/db/schema";
import type { CreatePaymentContext, PaymentPayload, PaymentProvider, QueryPaymentResult } from "../types";
import { createWaffoClient, type WaffoClient } from "./client";
import { centsToAmount } from "./crypto";

/** A session shorter than a minute would expire before a buyer reaches the card form. */
const MIN_SESSION_SECONDS = 60;

export type WaffoProvider = PaymentProvider & { readonly mode: "waffo" };

/**
 * Card payments through Waffo Pancake, the merchant of record for English orders: the buyer leaves
 * for the hosted checkout and comes back to `/pay/[orderId]`. The webhook is the primary signal;
 * `queryPayment` is the fallback the status poll uses when the callback is late.
 */
export function createWaffoProvider(client: WaffoClient = createWaffoClient()): WaffoProvider {
  return {
    mode: "waffo",

    async createPayment(order: OrderRow, ctx: CreatePaymentContext): Promise<PaymentPayload> {
      const seconds = Math.max(MIN_SESSION_SECONDS, Math.round((order.expiresAt.getTime() - Date.now()) / 1000));
      const session = await client.createSession({
        currency: order.currency,
        amount: centsToAmount(order.amountFen),
        successUrl: ctx.returnUrl,
        externalId: order.id,
        expiresInSeconds: seconds,
        metadata: { resultId: order.resultId },
      });
      return { kind: "redirect", url: session.checkoutUrl, expiresAt: session.expiresAt };
    },

    async queryPayment(order: OrderRow): Promise<QueryPaymentResult> {
      const payments = await client.paymentsFor(order.id);
      const paid = payments.find((p) => p.status === "succeeded");
      if (!paid) return { status: "pending" };
      return { status: "paid", txnId: paid.id, paidAt: paid.createdAt ? new Date(paid.createdAt) : undefined };
    },
  };
}
