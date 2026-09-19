import { createHash, createSign, createVerify } from "node:crypto";

/** Pure crypto helpers for Waffo Pancake. Kept free of env/DB access so they can be unit-tested with fixtures. */

/** Canonical request signed on API-key calls: `METHOD\nPATH\nTIMESTAMP\nSHA256_BASE64(BODY)`. */
export function requestMessage(method: string, path: string, timestamp: string, body: string): string {
  return `${method}\n${path}\n${timestamp}\n${createHash("sha256").update(body, "utf8").digest("base64")}`;
}

export function rsaSha256Sign(message: string, privateKeyPem: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(message, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

export function rsaSha256Verify(message: string, signatureBase64: string, publicKeyPem: string): boolean {
  const verifier = createVerify("RSA-SHA256");
  verifier.update(message, "utf8");
  try {
    return verifier.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

/** `X-Waffo-Signature: t=<epoch ms>,v1=<base64>`. Returns null when either part is missing. */
export function parseSignatureHeader(header: string | null): { t: string; v1: string } | null {
  if (!header) return null;
  const parts: Record<string, string> = {};
  for (const pair of header.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (rest.length) parts[key.trim()] = rest.join("=").trim();
  }
  return parts.t && parts.v1 ? { t: parts.t, v1: parts.v1 } : null;
}

/** Message the webhook signature covers: the timestamp and the raw body, exactly as received. */
export function webhookMessage(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

/** Replay window Waffo recommends for webhook timestamps. */
export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verifies an incoming webhook against Waffo's public key. The body must be the raw string:
 * re-serialising parsed JSON changes the bytes and fails the check.
 */
export function verifyWebhook(rawBody: string, header: string | null, publicKeyPem: string, now = Date.now(), tolerance = WEBHOOK_TOLERANCE_MS): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  const sentAt = Number(parsed.t);
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > tolerance) return false;
  return rsaSha256Verify(webhookMessage(parsed.t, rawBody), parsed.v1, publicKeyPem);
}

/** Minor units to the display-format amount the API expects: `690` -> `"6.90"`. */
export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Display-format amount back to minor units, for comparing a callback against the order. */
export function amountToCents(amount: string): number | null {
  // `Number("")` is 0, so an absent amount must be rejected before the conversion.
  if (!amount.trim()) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}
