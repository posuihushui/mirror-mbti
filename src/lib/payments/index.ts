import "server-only";
import { env } from "@/lib/env";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

let wechat: PaymentProvider | null = null;

export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (env().PAYMENT_PROVIDER === "wechat") {
    if (!wechat) {
      const { createWeChatProvider } = await import("./wechat");
      wechat = createWeChatProvider();
    }
    return wechat;
  }
  return mockProvider;
}

export type { PaymentPayload, PaymentProvider, OrderView } from "./types";
