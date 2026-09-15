import "server-only";
import { env } from "@/lib/env";
import type { CryptoProvider } from "./crypto";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

let wechat: PaymentProvider | null = null;
let crypto: CryptoProvider | null = null;

/**
 * The provider for a payment mode. Orders pass the mode of their own language (or the provider
 * stored on the order), so Chinese and English can use different providers side by side.
 */
export async function getPaymentProvider(mode: PaymentProvider["mode"] = env().PAYMENT_PROVIDER): Promise<PaymentProvider> {
  if (mode === "wechat") {
    if (!wechat) {
      const { createWeChatProvider } = await import("./wechat");
      wechat = createWeChatProvider();
    }
    return wechat;
  }
  if (mode === "crypto") return getCryptoProvider();
  return mockProvider;
}

export async function getCryptoProvider(): Promise<CryptoProvider> {
  if (!crypto) {
    const { createCryptoProvider } = await import("./crypto");
    crypto = createCryptoProvider();
  }
  return crypto;
}

export type { PaymentPayload, PaymentProvider, OrderView } from "./types";
