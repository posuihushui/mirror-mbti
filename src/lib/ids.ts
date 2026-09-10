import { randomBytes } from "node:crypto";

/** 12-char URL-safe id (~72 bits of entropy) for result URLs. */
export function newResultId(): string {
  return randomBytes(9).toString("base64url");
}

/** Order id that also serves as the provider `out_trade_no` (≤32 chars, alphanumeric). */
export function newOrderId(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `M${stamp}${randomBytes(8).toString("hex").toUpperCase()}`;
}
