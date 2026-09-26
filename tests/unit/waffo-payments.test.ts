import { createHash, createSign, createVerify, generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as waffoWebhook } from "@/app/api/payments/waffo/webhook/route";
import type { OrderRow } from "@/db/schema";
import { createWaffoClient } from "@/lib/payments/waffo/client";
import { createWaffoProvider } from "@/lib/payments/waffo";
import { amountToCents, centsToAmount } from "@/lib/payments/waffo/amounts";
import type { WaffoConfig } from "@/lib/payments/waffo/config";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString();

const config: WaffoConfig = {
  // The SDK checks the `MER_` + 22 base62 shape before any request.
  merchantId: "MER_0000000000000000000000",
  privateKey: privPem,
  storeId: "STO_ours",
  productId: "PROD_test",
  environment: "test",
  // Stands in for Waffo's platform key so the tests can sign webhooks.
  webhookPublicKey: pubPem,
  apiBase: "https://api.waffo.test",
};

const mocks = vi.hoisted(() => ({ getOrder: vi.fn(), recordEvent: vi.fn(), markPaid: vi.fn() }));

vi.mock("@/lib/env", () => ({ paymentModeFor: () => "waffo" }));
vi.mock("@/lib/orders", () => ({ getOrderByIdUnchecked: mocks.getOrder, recordPaymentEvent: mocks.recordEvent, markOrderPaid: mocks.markPaid }));
vi.mock("@/lib/payments/waffo/config", () => ({ waffoConfig: () => config }));

const order = {
  id: "MR250917ABCD",
  resultId: "res_1",
  amountFen: 690,
  currency: "USD",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
} as OrderRow;

const ctx = {
  channel: "card" as const,
  clientIp: "127.0.0.1",
  userAgent: null,
  description: "mirror full personality report · INFJ",
  notifyUrl: "https://mirror.test/api/payments/wechat/notify",
  returnUrl: "https://mirror.test/en/pay/MR250917ABCD",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrder.mockResolvedValue(order);
  mocks.recordEvent.mockResolvedValue(true);
  mocks.markPaid.mockResolvedValue({ id: order.id, status: "paid" });
});

describe("Waffo amounts", () => {
  it("converts between minor units and the display amount", () => {
    expect(centsToAmount(690)).toBe("6.90");
    expect(centsToAmount(1000)).toBe("10.00");
    expect(amountToCents("6.90")).toBe(690);
    expect(amountToCents("")).toBe(null);
    expect(amountToCents("not-a-number")).toBe(null);
  });
});

describe("Waffo provider", () => {
  it("creates a signed session priced from the order and returns a redirect payload", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.waffo.test/v1/actions/checkout/create-session");
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      expect(body.productId).toBe("PROD_test");
      expect(body.currency).toBe("USD");
      expect(body.priceSnapshot).toEqual({ amount: "6.90", taxCategory: "digital_goods" });
      expect(body.orderMerchantExternalId).toBe(order.id);
      expect(body.successUrl).toBe(ctx.returnUrl);
      expect(body.metadata).toEqual({ resultId: "res_1" });
      expect(Number(body.expiresInSeconds)).toBeGreaterThan(60);
      return new Response(JSON.stringify({ data: { sessionId: "cs_1", checkoutUrl: "https://checkout.waffo.test/cs_1", expiresAt: "2026-09-17T10:00:00.000Z" } }), { status: 200 });
    });
    const provider = createWaffoProvider(createWaffoClient(config, fetchMock as unknown as typeof fetch));

    const payload = await provider.createPayment(order, ctx);

    expect(payload).toEqual({ kind: "redirect", url: "https://checkout.waffo.test/cs_1", expiresAt: "2026-09-17T10:00:00.000Z" });
    // The request is signed with the merchant key over `METHOD\nPATH\nTIMESTAMP\nSHA256_BASE64(BODY)`.
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Merchant-Id"]).toBe(config.merchantId);
    const message = `POST\n/v1/actions/checkout/create-session\n${headers["X-Timestamp"]}\n${createHash("sha256").update(String(init.body)).digest("base64")}`;
    expect(createVerify("RSA-SHA256").update(message).verify(pubPem, headers["X-Signature"], "base64")).toBe(true);
  });

  it("reports a succeeded payment as paid and anything else as pending", async () => {
    const reply = (payments: unknown[]) =>
      vi.fn(async () => new Response(JSON.stringify({ data: { payments } }), { status: 200 })) as unknown as typeof fetch;

    const paid = createWaffoProvider(createWaffoClient(config, reply([{ id: "PAY_1", orderId: "ORD_1", status: "succeeded", refundStatus: null, createdAt: "2026-09-17T09:00:00.000Z" }])));
    await expect(paid.queryPayment(order)).resolves.toEqual({ status: "paid", txnId: "PAY_1", paidAt: new Date("2026-09-17T09:00:00.000Z") });

    const failed = createWaffoProvider(createWaffoClient(config, reply([{ id: "PAY_2", orderId: "ORD_1", status: "failed", refundStatus: null, createdAt: null }])));
    await expect(failed.queryPayment(order)).resolves.toEqual({ status: "pending" });

    const none = createWaffoProvider(createWaffoClient(config, reply([])));
    await expect(none.queryPayment(order)).resolves.toEqual({ status: "pending" });
  });

  it("surfaces API and GraphQL errors instead of returning a broken payload", async () => {
    const rejected = vi.fn(async () => new Response(JSON.stringify({ data: null, errors: [{ message: "Missing required fields: productId, currency", layer: "order" }] }), { status: 400 }));
    await expect(createWaffoProvider(createWaffoClient(config, rejected as unknown as typeof fetch)).createPayment(order, ctx)).rejects.toThrow("Missing required fields");

    const empty = vi.fn(async () => new Response(JSON.stringify({}), { status: 502 }));
    await expect(createWaffoProvider(createWaffoClient(config, empty as unknown as typeof fetch)).createPayment(order, ctx)).rejects.toThrow("no checkout URL");

    const graphql = vi.fn(async () => new Response(JSON.stringify({ data: null, errors: [{ message: "Unauthorized" }] }), { status: 200 }));
    await expect(createWaffoProvider(createWaffoClient(config, graphql as unknown as typeof fetch)).queryPayment(order)).rejects.toThrow("Unauthorized");
  });
});

type EventOverrides = { mode?: string; storeId?: string; eventType?: string; data?: Record<string, unknown> };

function waffoEvent({ mode = "test", storeId = "STO_ours", eventType = "order.completed", data = {} }: EventOverrides = {}): string {
  return JSON.stringify({
    id: "delivery-1",
    timestamp: "2026-09-26T09:00:00.000Z",
    eventType,
    eventId: "PAY_1",
    storeId,
    storeName: "mirror",
    mode,
    data: {
      orderId: "ORD_1",
      orderMerchantExternalId: order.id,
      buyerEmail: "buyer@example.com",
      currency: "USD",
      amount: "7.45",
      taxAmount: "0.55",
      listPrice: { total: "7.45", subtotal: "6.90", taxAmount: "0.55" },
      paymentId: "PAY_1",
      paymentStatus: "succeeded",
      ...data,
    },
  });
}

/** `X-Waffo-Signature: t=<epoch ms>,v1=<base64 RSA-SHA256 over "t.body">`. */
function signed(body: string, at = Date.now()): Request {
  const signature = createSign("RSA-SHA256").update(`${at}.${body}`).sign(privPem, "base64");
  return new Request("https://mirror.test/api/payments/waffo/webhook", { method: "POST", body, headers: { "x-waffo-signature": `t=${at},v1=${signature}` } });
}

describe("Waffo webhook", () => {
  const quietly = async (run: () => Promise<Response>) => {
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      return await run();
    } finally {
      logging.mockRestore();
    }
  };

  it("unlocks the order on a verified order.completed and stores it without the buyer's email", async () => {
    const response = await waffoWebhook(signed(waffoEvent()));

    expect(response.status).toBe(200);
    expect(mocks.markPaid).toHaveBeenCalledWith(order.id, "PAY_1", new Date("2026-09-26T09:00:00.000Z"), { allowExpired: true });
    const recorded = mocks.recordEvent.mock.calls[0][0] as { eventId: string; raw: { data: Record<string, unknown> } };
    expect(recorded.eventId).toBe("order.completed:PAY_1");
    expect(recorded.raw.data).not.toHaveProperty("buyerEmail");
  });

  it("accepts a retry whose original timestamp is half an hour old", async () => {
    // Retries reuse the first delivery's header, so the window has to outlast the retry schedule.
    const response = await waffoWebhook(signed(waffoEvent(), Date.now() - 30 * 60 * 1000));
    expect(response.status).toBe(200);
  });

  it("rejects a tampered body, a missing signature and a stale timestamp", async () => {
    const body = waffoEvent();
    const tampered = signed(body);
    const forged = new Request(tampered.url, { method: "POST", body: body.replace("6.90", "0.01"), headers: tampered.headers });

    for (const req of [forged, new Request(tampered.url, { method: "POST", body }), signed(body, Date.now() - 60 * 60 * 1000)]) {
      expect((await quietly(() => waffoWebhook(req))).status).toBe(401);
    }
    expect(mocks.recordEvent).not.toHaveBeenCalled();
    expect(mocks.markPaid).not.toHaveBeenCalled();
  });

  it("refuses genuine events from another store or the other environment", async () => {
    // Waffo signs every merchant's events with the same key: another store could reuse our order id.
    for (const body of [waffoEvent({ storeId: "STO_theirs" }), waffoEvent({ mode: "prod" })]) {
      expect((await quietly(() => waffoWebhook(signed(body)))).status).toBe(400);
    }
    expect(mocks.recordEvent).not.toHaveBeenCalled();
    expect(mocks.markPaid).not.toHaveBeenCalled();
  });

  it("checks the pre-tax list price against the order, falling back to the deprecated subtotal", async () => {
    const underpaid = waffoEvent({ data: { listPrice: { total: "1.08", subtotal: "1.00", taxAmount: "0.08" } } });
    expect((await quietly(() => waffoWebhook(signed(underpaid)))).status).toBe(400);
    expect(mocks.markPaid).not.toHaveBeenCalled();

    const legacy = waffoEvent({ data: { listPrice: undefined, subtotal: "6.90" } });
    expect((await waffoWebhook(signed(legacy))).status).toBe(200);
    expect(mocks.markPaid).toHaveBeenCalledOnce();
  });

  it("records refunds without revoking anything", async () => {
    const response = await waffoWebhook(signed(waffoEvent({ eventType: "refund.succeeded" })));
    expect(response.status).toBe(200);
    expect(mocks.recordEvent).toHaveBeenCalledOnce();
    expect(mocks.markPaid).not.toHaveBeenCalled();
  });
});
