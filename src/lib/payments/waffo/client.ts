import "server-only";
import { TaxCategory, WaffoPancake, type CheckoutSessionResult } from "@waffo/pancake-ts";
import { waffoConfig, type WaffoConfig } from "./config";

export type CheckoutSession = CheckoutSessionResult;

/** One payment attempt on a Waffo order, as returned by the read-only GraphQL API. */
export type WaffoPayment = { id: string; orderId: string; status: string; refundStatus: string | null; createdAt: string | null };

export type CreateSessionInput = {
  currency: string;
  /** Display-format price, e.g. `"6.90"`. Replaces the product's own price for this session. */
  amount: string;
  successUrl: string;
  /** Our order id, echoed back on webhooks and queryable as `orderMerchantExternalId`. */
  externalId: string;
  expiresInSeconds: number;
  metadata?: Record<string, string>;
};

export type WaffoClient = ReturnType<typeof createWaffoClient>;

/**
 * Server-to-server client on `@waffo/pancake-ts`. The SDK signs every request with the merchant's
 * RSA private key; the key never leaves the server and no API secret is sent.
 */
export function createWaffoClient(config: WaffoConfig = waffoConfig(), fetchImpl?: typeof fetch) {
  const sdk = new WaffoPancake({ merchantId: config.merchantId, privateKey: config.privateKey, baseUrl: config.apiBase, fetch: fetchImpl });

  return {
    /** Locks product version, price and currency, and returns the hosted checkout URL. */
    async createSession(input: CreateSessionInput): Promise<CheckoutSession> {
      const { sessionId, checkoutUrl, expiresAt } = await sdk.checkout.createSession({
        productId: config.productId,
        currency: input.currency,
        // Prices are tax-exclusive: tax is added at checkout, so the callback's list subtotal is what we charged.
        priceSnapshot: { amount: input.amount, taxCategory: TaxCategory.DigitalGoods },
        successUrl: input.successUrl,
        expiresInSeconds: input.expiresInSeconds,
        orderMerchantExternalId: input.externalId,
        metadata: input.metadata,
        language: "en",
        includePaymentMethods: ["card", "applepay", "googlepay"],
      });
      // The SDK only throws on an `errors` envelope; a bare non-2xx would otherwise come back empty.
      if (!checkoutUrl) throw new Error("Waffo returned no checkout URL");
      return { sessionId, checkoutUrl, expiresAt };
    },

    /** Payment attempts for one of our order ids, newest first. */
    async paymentsFor(externalId: string): Promise<WaffoPayment[]> {
      const result = await sdk.graphql.query<{ payments: WaffoPayment[] | null }>({
        query: `query($ref: String!) { payments(filter: { orderMerchantExternalId: { eq: $ref } }) { id orderId status refundStatus createdAt } }`,
        variables: { ref: externalId },
      });
      // GraphQL reports failures in the envelope rather than throwing.
      if (result.errors?.length) throw new Error(`Waffo payments query failed: ${result.errors[0].message}`);
      return result.data?.payments ?? [];
    },
  };
}
