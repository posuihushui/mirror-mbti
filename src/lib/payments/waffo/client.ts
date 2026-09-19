import "server-only";
import { waffoConfig, type WaffoConfig } from "./config";
import { requestMessage, rsaSha256Sign } from "./crypto";

const CHECKOUT_PATH = "/v1/actions/checkout/create-session";
const GRAPHQL_PATH = "/v1/graphql";

export type CheckoutSession = { sessionId: string; checkoutUrl: string; expiresAt: string };

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

export class WaffoApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type WaffoClient = ReturnType<typeof createWaffoClient>;

/**
 * Signed server-to-server client. Requests carry an RSA-SHA256 signature over the canonical
 * request; the private key never leaves the server and no API secret is sent.
 */
export function createWaffoClient(config: WaffoConfig = waffoConfig(), fetchImpl: typeof fetch = fetch) {
  async function call<T>(path: string, body: unknown): Promise<T> {
    const payload = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const res = await fetchImpl(`${config.apiBase}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-merchant-id": config.merchantId,
        "x-timestamp": timestamp,
        "x-signature": rsaSha256Sign(requestMessage("POST", path, timestamp, payload), config.privateKey),
      },
      body: payload,
      cache: "no-store",
    });
    const text = await res.text();
    let json: { data?: T; errors?: { message?: string }[] };
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      throw new WaffoApiError(`Waffo returned a non-JSON response (${res.status})`, res.status);
    }
    const error = json.errors?.[0]?.message;
    if (!res.ok || error || json.data === undefined) throw new WaffoApiError(error ?? `Waffo request failed (${res.status})`, res.status);
    return json.data;
  }

  return {
    /** Locks product version, price and currency, and returns the hosted checkout URL. */
    createSession(input: CreateSessionInput): Promise<CheckoutSession> {
      return call<CheckoutSession>(CHECKOUT_PATH, {
        productId: config.productId,
        currency: input.currency,
        // Tax is added on top of this amount at checkout, so `subtotal` on the callback is what we charged.
        priceSnapshot: { amount: input.amount, taxIncluded: false, taxCategory: "digital_goods" },
        successUrl: input.successUrl,
        expiresInSeconds: input.expiresInSeconds,
        orderMerchantExternalId: input.externalId,
        metadata: input.metadata,
        language: "en",
        includePaymentMethods: ["card", "applepay", "googlepay"],
      });
    },

    /** Payment attempts for one of our order ids, newest first. */
    async paymentsFor(externalId: string): Promise<WaffoPayment[]> {
      const data = await call<{ payments: WaffoPayment[] | null }>(GRAPHQL_PATH, {
        query: `query($ref: String!) { payments(filter: { orderMerchantExternalId: { eq: $ref } }) { id orderId status refundStatus createdAt } }`,
        variables: { ref: externalId },
      });
      return data.payments ?? [];
    },
  };
}
