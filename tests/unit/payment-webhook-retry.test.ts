import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as waffoWebhook } from "@/app/api/payments/waffo/webhook/route";
import { POST as wechatNotify } from "@/app/api/payments/wechat/notify/route";

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  recordEvent: vi.fn(),
  markPaid: vi.fn(),
  setStatus: vi.fn(),
  verifyWeChat: vi.fn(),
  decryptWeChat: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ paymentMode: () => "wechat", paymentModeFor: () => "waffo" }));
vi.mock("@/lib/orders", () => ({
  getOrderByIdUnchecked: mocks.getOrder,
  recordPaymentEvent: mocks.recordEvent,
  markOrderPaid: mocks.markPaid,
  setOrderStatus: mocks.setStatus,
}));
vi.mock("@/lib/payments/waffo/config", () => ({ waffoConfig: () => ({ webhookPublicKey: "test-key" }) }));
vi.mock("@/lib/payments/waffo/crypto", () => ({ verifyWebhook: () => true, amountToCents: (amount: string) => Math.round(Number(amount) * 100) }));
vi.mock("@/lib/payments/wechat", () => ({ weChatClient: () => ({ verifySignature: mocks.verifyWeChat, decryptResource: mocks.decryptWeChat }) }));

const orderId = "M2026092600000000PAYMENTTEST";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrder.mockResolvedValue({ id: orderId, amountFen: 690, currency: "USD" });
  mocks.recordEvent.mockResolvedValue(false); // The prior delivery recorded the event, then failed.
  mocks.markPaid.mockResolvedValue({ id: orderId, status: "paid" });
  mocks.verifyWeChat.mockResolvedValue(true);
  mocks.decryptWeChat.mockReturnValue(JSON.stringify({ out_trade_no: orderId, trade_state: "SUCCESS", transaction_id: "wx-txn", amount: { total: 690 } }));
});

describe("payment webhook retries", () => {
  it("retries Waffo fulfillment even when the event ID was previously recorded", async () => {
    const body = JSON.stringify({ eventType: "order.completed", eventId: "waffo-event", data: { orderMerchantExternalId: orderId, currency: "USD", subtotal: "6.90", paymentId: "waffo-payment" } });
    const response = await waffoWebhook(new Request("https://mirror.example/api/payments/waffo/webhook", { method: "POST", body }));

    expect(response.status).toBe(200);
    expect(mocks.recordEvent).toHaveBeenCalledOnce();
    expect(mocks.markPaid).toHaveBeenCalledWith(orderId, "waffo-payment", expect.any(Date), { allowExpired: true });
  });

  it("still rejects an already-recorded Waffo event with the wrong amount", async () => {
    const body = JSON.stringify({ eventType: "order.completed", eventId: "waffo-event", data: { orderMerchantExternalId: orderId, currency: "USD", subtotal: "1.00" } });
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await waffoWebhook(new Request("https://mirror.example/api/payments/waffo/webhook", { method: "POST", body }));
      expect(response.status).toBe(400);
      expect(mocks.markPaid).not.toHaveBeenCalled();
    } finally {
      logging.mockRestore();
    }
  });

  it("retries WeChat fulfillment even when the notification ID was previously recorded", async () => {
    const body = JSON.stringify({ id: "wechat-event", event_type: "TRANSACTION.SUCCESS", resource: { algorithm: "AEAD_AES_256_GCM", ciphertext: "encrypted", nonce: "nonce" } });
    const response = await wechatNotify(new Request("https://mirror.example/api/payments/wechat/notify", { method: "POST", body }));

    expect(response.status).toBe(200);
    expect(mocks.recordEvent).toHaveBeenCalledOnce();
    expect(mocks.markPaid).toHaveBeenCalledWith(orderId, "wx-txn", expect.any(Date));
  });
});
