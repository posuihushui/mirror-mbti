import "server-only";
import { env } from "@/lib/env";

export type WaffoConfig = {
  merchantId: string;
  privateKey: string;
  storeId: string;
  productId: string;
  /** The environment the API key belongs to. Waffo derives it from the key; webhooks name it in `mode`. */
  environment: "test" | "prod";
  /** Overrides the webhook key the SDK ships for `environment`; only needed after Waffo rotates it. */
  webhookPublicKey?: string;
  apiBase: string;
};

/** Reads and validates the merchant configuration; throws a clear error when incomplete. */
export function waffoConfig(): WaffoConfig {
  const e = env();
  const missing = (["WAFFO_MERCHANT_ID", "WAFFO_PRIVATE_KEY", "WAFFO_STORE_ID", "WAFFO_PRODUCT_ID", "WAFFO_ENVIRONMENT"] as const).filter((k) => !e[k]);
  if (missing.length) throw new Error(`Waffo Pancake is enabled but missing env: ${missing.join(", ")}`);
  return {
    merchantId: e.WAFFO_MERCHANT_ID!,
    // The SDK normalises PEM, literal `\n` from env files and bare base64.
    privateKey: e.WAFFO_PRIVATE_KEY!,
    storeId: e.WAFFO_STORE_ID!,
    productId: e.WAFFO_PRODUCT_ID!,
    environment: e.WAFFO_ENVIRONMENT!,
    webhookPublicKey: e.WAFFO_WEBHOOK_PUBLIC_KEY || undefined,
    apiBase: e.WAFFO_API_BASE.replace(/\/$/, ""),
  };
}
