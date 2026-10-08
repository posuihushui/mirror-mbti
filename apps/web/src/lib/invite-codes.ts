import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, schema, type Db } from "@/db";
import { appUrl } from "@/lib/env";
import { href, type Locale } from "@/lib/i18n/locale";
import type { PairingTx } from "@/lib/pairing-eligibility";
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH, normalizeInviteCode } from "@/lib/invite-code-format";

export { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE, normalizeInviteCode } from "@/lib/invite-code-format";

const C = schema.inviteCodes, R = schema.results;
type Reader = Db | PairingTx;

function newCode() {
  return Array.from({ length: INVITE_CODE_LENGTH }, () => INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]).join("");
}

/**
 * The invite code of an unlocked report, created on first use. Returns null for a result that is
 * not the visitor's or not unlocked: only a reader of the full report has a code to hand out.
 */
export async function ensureInviteCode(resultId: string, visitorId: string, reader: Reader = db()): Promise<string | null> {
  const [existing] = await reader.select({ code: C.code }).from(C).where(eq(C.resultId, resultId)).limit(1);
  if (existing) return existing.code;
  const [owned] = await reader.select({ id: R.id }).from(R)
    .where(and(eq(R.id, resultId), eq(R.visitorId, visitorId), isNotNull(R.unlockedAt))).limit(1);
  if (!owned) return null;
  // Six characters from 31 give ~887 million codes; a collision simply draws again.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [row] = await reader.insert(C).values({ code: newCode(), resultId, visitorId }).onConflictDoNothing().returning({ code: C.code });
    if (row) return row.code;
    const [raced] = await reader.select({ code: C.code }).from(C).where(eq(C.resultId, resultId)).limit(1);
    if (raced) return raced.code;
  }
  throw new Error("[invite-codes] could not draw a free code");
}

/** A code that may still give the invite price: it exists and has not been disabled. */
export async function activeInviteCode(raw: string | null | undefined) {
  const code = normalizeInviteCode(raw);
  if (!code) return null;
  const [row] = await db().select({ code: C.code, visitorId: C.visitorId, resultId: C.resultId }).from(C)
    .where(and(eq(C.code, code), isNull(C.disabledAt))).limit(1);
  return row ?? null;
}

/** The link a reader hands out to invite someone to take the test (no pairing). */
export function inviteLinkFor(locale: Locale, code: string) {
  return `${appUrl()}${href(locale, `/i/${code}`)}`;
}
