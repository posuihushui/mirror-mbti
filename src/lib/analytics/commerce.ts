import type { Locale } from "@/lib/i18n/locale";
import type { OrderView } from "@/lib/payments/types";

export type ReportItem = { item_id: "full_report"; item_name: "Full report"; item_category: "report"; price: number; quantity: 1 };
export type ReportCommerce = { currency: string; value: number; items: ReportItem[] };

export function currencyFor(locale: Locale): "CNY" | "USD" {
  return locale === "en" ? "USD" : "CNY";
}

/** Fen or cents to the major unit GA4 expects. */
export function minorToValue(minor: number): number {
  return Math.round(minor) / 100;
}

/** `formatPriceFen` output (`"6.9"`) back to minor units. */
export function priceLabelToMinor(label: string): number {
  return Math.round(Number(label) * 100);
}

/** The single product: one full report. */
export function reportCommerce(currency: string, minor: number): ReportCommerce {
  const value = minorToValue(minor);
  return { currency, value, items: [{ item_id: "full_report", item_name: "Full report", item_category: "report", price: value, quantity: 1 }] };
}

/** `mock`, `wechat_jsapi` / `wechat_h5` / `wechat_native`, `crypto_ethereum` / `crypto_solana`, `waffo_card`. */
export function paymentTypeOf(order: Pick<OrderView, "provider" | "channel">): string {
  return order.provider === "mock" ? "mock" : `${order.provider}_${order.channel}`;
}

/**
 * A one-way `transaction_id` so GA can deduplicate purchases. Order numbers are recovery
 * credentials and never leave the site; 64+ random bits make the hash impractical to reverse.
 */
export async function transactionId(orderId: string): Promise<string | undefined> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return undefined;
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(`mirror-order:${orderId}`));
  return Array.from(new Uint8Array(digest).slice(0, 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
