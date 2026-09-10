import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "mid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sign(id: string, secret: string) {
  return createHmac("sha256", secret).update(id).digest("base64url");
}

export function issueVisitorToken(secret: string): { id: string; token: string } {
  const id = randomUUID();
  return { id, token: `${id}.${sign(id, secret)}` };
}

/** Returns the visitor id when the cookie value carries a valid signature. */
export function verifyVisitorToken(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!UUID_RE.test(id)) return null;
  const expected = sign(id, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
