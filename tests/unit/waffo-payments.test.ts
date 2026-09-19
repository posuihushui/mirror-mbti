import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { OrderRow } from "@/db/schema";
import { createWaffoClient } from "@/lib/payments/waffo/client";
import { createWaffoProvider } from "@/lib/payments/waffo";
import {
  amountToCents,
  centsToAmount,
  parseSignatureHeader,
  requestMessage,
  rsaSha256Sign,
  rsaSha256Verify,
  verifyWebhook,
  webhookMessage,
} from "@/lib/payments/waffo/crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const otherPub = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({ type: "spki", format: "pem" }).toString();

const config = {
  merchantId: "MER_test",
  privateKey: privPem,
  storeId: "STO_test",
  productId: "PROD_test",
  webhookPublicKey: pubPem,
  apiBase: "https://api.waffo.test",
};

function signedHeader(body: string, at = Date.now()): string {
  return `t=${at},v1=${rsaSha256Sign(webhookMessage(String(at), body), privPem)}`;
}

describe("Waffo request signing", () => {
  it("signs the canonical request, hashing the body", () => {
    const body = '{"productId":"PROD_test"}';
    const message = requestMessage("POST", "/v1/actions/checkout/create-session", "1711800000", body);
    const [method, path, timestamp, bodyHash] = message.split("\n");
    expect([method, path, timestamp]).toEqual(["POST", "/v1/actions/checkout/create-session", "1711800000"]);
    // SHA-256 of the body, base64 — 44 characters with the trailing pad.
    expect(bodyHash).toHaveLength(44);
    expect(rsaSha256Verify(message, rsaSha256Sign(message, privPem), pubPem)).toBe(true);
    expect(rsaSha256Verify(requestMessage("POST", "/v1/graphql", "1711800000", body), rsaSha256Sign(message, privPem), pubPem)).toBe(false);
  });

  it("converts between minor units and the display amount", () => {
    expect(centsToAmount(690)).toBe("6.90");
    expect(centsToAmount(1000)).toBe("10.00");
    expect(amountToCents("6.90")).toBe(690);
    expect(amountToCents("")).toBe(null);
    expect(amountToCents("not-a-number")).toBe(null);
  });
});

describe("Waffo webhook verification", () => {
  const body = '{"eventType":"order.completed","eventId":"PAY_1"}';

  it("accepts a freshly signed body", () => {
    expect(verifyWebhook(body, signedHeader(body), pubPem)).toBe(true);
  });

  it("rejects a tampered body, a foreign key and a malformed header", () => {
    const header = signedHeader(body);
    expect(verifyWebhook(`${body} `, header, pubPem)).toBe(false);
    expect(verifyWebhook(body, header, otherPub)).toBe(false);
    expect(verifyWebhook(body, "v1=abc", pubPem)).toBe(false);
    expect(verifyWebhook(body, null, pubPem)).toBe(false);
  });

  it("rejects timestamps outside the replay window", () => {
    const stale = Date.now() - 10 * 60 * 1000;
    expect(verifyWebhook(body, signedHeader(body, stale), pubPem)).toBe(false);
    // Still valid when checked close to when it was sent.
    expect(verifyWebhook(body, signedHeader(body, stale), pubPem, stale + 1000)).toBe(true);
  });

  it("parses the signature header", () => {
    expect(parseSignatureHeader("t=1700000000000,v1=YWJj")).toEqual({ t: "1700000000000", v1: "YWJj" });
    expect(parseSignatureHeader(" t=1 , v1=YQ== ")).toEqual({ t: "1", v1: "YQ==" });
    expect(parseSignatureHeader("t=1")).toBe(null);
  });
});

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

describe("Waffo provider", () => {
  it("creates a session priced from the order and returns a redirect payload", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      expect(body.productId).toBe("PROD_test");
      expect(body.currency).toBe("USD");
      expect(body.priceSnapshot).toEqual({ amount: "6.90", taxIncluded: false, taxCategory: "digital_goods" });
      expect(body.orderMerchantExternalId).toBe(order.id);
      expect(body.successUrl).toBe(ctx.returnUrl);
      expect(body.metadata).toEqual({ resultId: "res_1" });
      expect(Number(body.expiresInSeconds)).toBeGreaterThan(60);
      return new Response(JSON.stringify({ data: { sessionId: "cs_1", checkoutUrl: "https://checkout.waffo.test/cs_1", expiresAt: "2026-09-17T10:00:00.000Z" } }), { status: 200 });
    });
    const provider = createWaffoProvider(createWaffoClient(config, fetchMock as unknown as typeof fetch));

    const payload = await provider.createPayment(order, ctx);

    expect(payload).toEqual({ kind: "redirect", url: "https://checkout.waffo.test/cs_1", expiresAt: "2026-09-17T10:00:00.000Z" });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["x-merchant-id"]).toBe("MER_test");
    expect(headers["x-signature"]).toBeTruthy();
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

  it("surfaces API errors instead of returning a broken payload", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "Missing required fields: productId, currency" }] }), { status: 400 }));
    const provider = createWaffoProvider(createWaffoClient(config, fetchMock as unknown as typeof fetch));
    await expect(provider.createPayment(order, ctx)).rejects.toThrow("Missing required fields");
  });
});
