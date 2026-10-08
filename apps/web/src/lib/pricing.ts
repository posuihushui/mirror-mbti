import "server-only";
import { and, eq, gt, isNotNull, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { giftPriceMinorFor, invitePriceMinorFor, priceMinorFor } from "@/lib/env";
import type { Locale } from "@/lib/i18n/locale";
import { openInvitationHost } from "@/lib/comparisons";
import { listComparisonContinuations } from "@/lib/comparison-continuations";
import { activeInviteCode, ensureInviteCode } from "@/lib/invite-codes";
import { getPairingEligibility } from "@/lib/pairing-eligibility";
import { formatPriceFen } from "@/lib/site";

const R = schema.results, O = schema.orders;

/** An open invitation someone else made from a report they still read: what pay-to-pair can join. */
export type QuotedInvitation = NonNullable<Awaited<ReturnType<typeof openInvitationHost>>>;

/**
 * What a report costs this visitor right now, and the invitation they came from (if any), which
 * the result page offers to join as they pay. `label` / `listLabel` are `formatPriceFen` output.
 */
export type ReportQuote = {
  amount: number;
  list: number;
  pricing: "list" | "invite";
  inviteCode: string | null;
  label: string;
  listLabel: string;
  invitation: QuotedInvitation | null;
};

/**
 * Whether this visitor has had their invite price: they already read a full report of their own,
 * have paid for one, or have another report's order waiting at the invite price. Orders for this
 * same result don't count, so a retried payment keeps its price.
 */
async function inviteUsed(visitorId: string, resultId: string | null) {
  const [unlocked] = await db().select({ id: R.id }).from(R).where(and(eq(R.visitorId, visitorId), isNotNull(R.unlockedAt))).limit(1);
  if (unlocked) return true;
  const [order] = await db().select({ id: O.id }).from(O).where(and(
    eq(O.visitorId, visitorId), eq(O.kind, "report"),
    or(eq(O.status, "paid"), and(eq(O.pricing, "invite"), eq(O.status, "created"), gt(O.expiresAt, new Date()), resultId ? ne(O.resultId, resultId) : undefined)),
  )).limit(1);
  return Boolean(order);
}

/**
 * The invitation this visitor came from: the token in hand first, then the ones they saved on their
 * way through the test. It must be open, someone else's, and made from a report its host still reads.
 */
async function invitationFor(visitorId: string, token: string | null, saved?: string[]) {
  const tokens = [...new Set([token, ...(saved ?? (await listComparisonContinuations(visitorId)).map((item) => item.invitationToken))]
    .filter((item): item is string => Boolean(item)))].slice(0, 4);
  for (const candidate of tokens) {
    const host = await openInvitationHost(candidate);
    if (!host || host.visitorId === visitorId) continue;
    if (await getPairingEligibility(host.resultId, host.visitorId) === "eligible") return host;
  }
  return null;
}

/**
 * The one place a report's price is decided, for the page that shows it and the order that charges
 * it alike. A visitor's first report is at the invite price when they came through someone's open
 * invitation or someone else's invite link (the `minv` cookie); everything else is the list price.
 * Only an order records which code gave the price (`record`), so showing a price never writes.
 */
export async function quoteReport(input: {
  visitorId: string; locale: Locale; resultId?: string; invitationToken?: string | null; cookieCode?: string | null;
  /** The visitor's saved invitation tokens, when the caller already has them. */
  savedTokens?: string[];
  record?: boolean;
}): Promise<ReportQuote> {
  const list = priceMinorFor(input.locale), invite = invitePriceMinorFor(input.locale);
  const invitation = await invitationFor(input.visitorId, input.invitationToken ?? null, input.savedTokens);
  const at = (amount: number, pricing: ReportQuote["pricing"], inviteCode: string | null): ReportQuote =>
    ({ amount, list, pricing, inviteCode, label: formatPriceFen(amount), listLabel: formatPriceFen(list), invitation });
  if (invite >= list || await inviteUsed(input.visitorId, input.resultId ?? null)) return at(list, "list", null);
  if (invitation) return at(invite, "invite", input.record ? await ensureInviteCode(invitation.resultId, invitation.visitorId) : null);
  const link = await activeInviteCode(input.cookieCode);
  if (link && link.visitorId !== input.visitorId) return at(invite, "invite", link.code);
  return at(list, "list", null);
}

/** 请 TA's price in a language, with the list price it is read against. */
export function giftQuote(locale: Locale) {
  const amount = giftPriceMinorFor(locale), list = priceMinorFor(locale);
  return { amount, list, label: formatPriceFen(amount), listLabel: formatPriceFen(list) };
}
