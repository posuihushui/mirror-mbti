import "server-only";
import { env } from "@/lib/env";

export type WaffoConfig = {
  merchantId: string;
  privateKey: string;
  storeId: string;
  productId: string;
  webhookPublicKey: string;
  apiBase: string;
};

function pem(value: string | undefined): string | null {
  if (!value) return null;
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

/** Reads and validates the merchant configuration; throws a clear error when incomplete. */
export function waffoConfig(): WaffoConfig {
  const e = env();
  const missing = (["WAFFO_MERCHANT_ID", "WAFFO_PRIVATE_KEY", "WAFFO_STORE_ID", "WAFFO_PRODUCT_ID", "WAFFO_WEBHOOK_PUBLIC_KEY"] as const).filter((k) => !e[k]);
  if (missing.length) throw new Error(`Waffo Pancake is enabled but missing env: ${missing.join(", ")}`);
  return {
    merchantId: e.WAFFO_MERCHANT_ID!,
    privateKey: pem(e.WAFFO_PRIVATE_KEY)!,
    storeId: e.WAFFO_STORE_ID!,
    productId: e.WAFFO_PRODUCT_ID!,
    webhookPublicKey: pem(e.WAFFO_WEBHOOK_PUBLIC_KEY)!,
    apiBase: e.WAFFO_API_BASE.replace(/\/$/, ""),
  };
}
