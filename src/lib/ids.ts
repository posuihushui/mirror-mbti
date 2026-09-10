import { randomBytes } from "node:crypto";

/** 12-char URL-safe id (~72 bits of entropy) for result URLs. */
export function newResultId(): string {
  return randomBytes(9).toString("base64url");
}

/** Order id that also serves as the provider `out_trade_no` (≤32 chars, alphanumeric). */
export function newOrderId(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  // 88 random bits: the complete order number can also recover a visitor session.
  return `M${stamp}${randomBytes(11).toString("hex").toUpperCase()}`;
}

/** Accepts both existing 25-character orders and new 31-character orders. */
export function isValidOrderId(id: string): boolean {
  return /^M\d{8}(?:[0-9A-F]{16}|[0-9A-F]{22})$/.test(id);
}
