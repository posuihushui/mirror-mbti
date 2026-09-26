import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db, schema, type Db } from "@/db";
import type { OrderRow } from "@/db/schema";
import type { Locale } from "@/lib/i18n/locale";
import { paymentModeFor, priceLabelFor } from "@/lib/env";
import { cryptoNetworks } from "@/lib/payments/crypto/config";
import type { PairingTx as Tx } from "@/lib/pairing-eligibility";
import { ShareError } from "@/lib/share-policy";

/**
 * 请 TA: a host covers one participant's report on an invitation. A paid `pair-gift` order becomes
 * one row here. It sits on an open invitation until a participant whose result is still locked
 * agrees to join; that join unlocks their result. A gift whose invitation closes or expires
 * unclaimed is "available" and moves to the host's next invitation in the same language.
 * Lock order everywhere: share → invitation → gift, as for the rest of pairing.
 */
const G = schema.pairGifts, I = schema.comparisonInvitations, S = schema.resultShares, R = schema.results;
type Reader = Db | Tx;
type Invitation = typeof I.$inferSelect;

/** An invitation a gift may sit on: paid policy, not closed or expired, parent share (if any) open. */
function isOpen(invitation: Pick<Invitation, "accessPolicy" | "revokedAt" | "expiresAt">, shareRevokedAt: Date | null | undefined, now = new Date()) {
  return invitation.accessPolicy === "paid-pair-v2" && !invitation.revokedAt && invitation.expiresAt > now && !shareRevokedAt;
}
/** Unclaimed gifts whose invitation is gone, closed, expired or behind a closed share. */
function availableWhere(visitorId: string, locale: Locale, now = new Date()) {
  return and(eq(G.visitorId, visitorId), eq(G.locale, locale), isNull(G.claimedAt),
    or(isNull(G.invitationId), isNotNull(I.revokedAt), lte(I.expiresAt, now), isNotNull(S.revokedAt)));
}

/** Locks an invitation by id in share → invitation order and returns it with its share's state. */
async function lockInvitationById(tx: Tx, invitationId: string) {
  const key = await tx.query.comparisonInvitations.findFirst({ where: eq(I.id, invitationId), columns: { shareId: true } });
  if (!key) return null;
  const [share] = key.shareId ? await tx.select({ revokedAt: S.revokedAt }).from(S).where(eq(S.id, key.shareId)).for("update") : [];
  const [invitation] = await tx.select().from(I).where(eq(I.id, invitationId)).for("update");
  return invitation ? { invitation, shareRevokedAt: share?.revokedAt ?? null } : null;
}

async function openGiftFor(reader: Reader, invitationId: string, lock = false) {
  const query = reader.select().from(G).where(and(eq(G.invitationId, invitationId), isNull(G.claimedAt))).limit(1);
  const [gift] = lock ? await query.for("update") : await query;
  return gift ?? null;
}

async function firstAvailable(tx: Tx, visitorId: string, locale: Locale) {
  const [row] = await tx.select({ id: G.id }).from(G).leftJoin(I, eq(I.id, G.invitationId)).leftJoin(S, eq(S.id, I.shareId))
    .where(availableWhere(visitorId, locale)).orderBy(asc(G.createdAt), asc(G.id)).limit(1).for("update", { of: G });
  return row ?? null;
}

/** Moves one of the host's available gifts onto an invitation the caller has already locked. */
export async function attachAvailableGift(tx: Tx, invitation: Pick<Invitation, "id" | "visitorId" | "locale">) {
  if (await openGiftFor(tx, invitation.id, true)) return true;
  const gift = await firstAvailable(tx, invitation.visitorId, invitation.locale as Locale);
  if (!gift) return false;
  await tx.update(G).set({ invitationId: invitation.id }).where(eq(G.id, gift.id));
  return true;
}

/** The host asks to use an available gift on one of their open invitations. Idempotent. */
export async function attachGiftToInvitation(visitorId: string, invitationId: string) {
  return db().transaction(async (tx) => {
    const locked = await lockInvitationById(tx, invitationId);
    if (!locked || locked.invitation.visitorId !== visitorId) throw new ShareError(404, "NOT_FOUND");
    if (!isOpen(locked.invitation, locked.shareRevokedAt)) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    if (!(await attachAvailableGift(tx, locked.invitation))) throw new ShareError(409, "GIFT_NONE_AVAILABLE");
    return { invitationId, covered: true };
  });
}

/** Why a host may not buy a gift for an invitation now; null when they may. */
export async function giftPurchaseBlock(visitorId: string, invitationId: string): Promise<
  { code: "NOT_FOUND" | "INVITATION_UNAVAILABLE" | "GIFT_ALREADY_COVERED" | "GIFT_AVAILABLE" } | { invitation: Invitation }
> {
  const [row] = await db().select({ invitation: I, shareRevokedAt: S.revokedAt }).from(I).leftJoin(S, eq(S.id, I.shareId))
    .where(and(eq(I.id, invitationId), eq(I.visitorId, visitorId))).limit(1);
  if (!row) return { code: "NOT_FOUND" };
  if (!isOpen(row.invitation, row.shareRevokedAt)) return { code: "INVITATION_UNAVAILABLE" };
  if (await openGiftFor(db(), invitationId)) return { code: "GIFT_ALREADY_COVERED" };
  const [spare] = await db().select({ id: G.id }).from(G).leftJoin(I, eq(I.id, G.invitationId)).leftJoin(S, eq(S.id, I.shareId))
    .where(availableWhere(visitorId, row.invitation.locale as Locale)).limit(1);
  if (spare) return { code: "GIFT_AVAILABLE" };
  return { invitation: row.invitation };
}

/**
 * A paid `pair-gift` order becomes exactly one gift. It lands on the invitation it was bought for
 * when that is still open and uncovered; otherwise it waits as an available gift. Safe to repeat.
 */
export async function fulfillGiftOrder(order: OrderRow) {
  if (order.kind !== "pair-gift" || order.status !== "paid" || !order.invitationId) return;
  await db().transaction(async (tx) => {
    const locked = await lockInvitationById(tx, order.invitationId!);
    const [existing] = await tx.select({ id: G.id }).from(G).where(eq(G.orderId, order.id)).for("update");
    if (existing) return;
    const target = locked && isOpen(locked.invitation, locked.shareRevokedAt) && !(await openGiftFor(tx, locked.invitation.id, true)) ? locked.invitation.id : null;
    await tx.insert(G).values({ id: randomUUID(), orderId: order.id, visitorId: order.visitorId, locale: order.currency === "USD" ? "en" : "zh", invitationId: target })
      .onConflictDoNothing({ target: G.orderId });
  });
}

/**
 * Inside a join, after the invitation is locked: uses the invitation's gift to unlock the joining
 * participant's still-locked result. Returns false when there is no gift to use.
 */
export async function claimGift(tx: Tx, invitationId: string, visitorId: string, resultId: string) {
  const gift = await openGiftFor(tx, invitationId, true);
  if (!gift) return false;
  const now = new Date();
  const unlocked = await tx.update(R).set({ unlockedAt: now })
    .where(and(eq(R.id, resultId), eq(R.visitorId, visitorId), isNull(R.unlockedAt))).returning({ id: R.id });
  if (!unlocked.length) return false;
  await tx.update(G).set({ claimedAt: now, claimedVisitorId: visitorId, claimedResultId: resultId }).where(eq(G.id, gift.id));
  return true;
}

/** Which of these invitations (by token) carry an unclaimed gift right now. Public: a yes/no only. */
export async function coveredTokens(tokens: string[]) {
  if (!tokens.length) return new Set<string>();
  const rows = await db().select({ token: I.token }).from(G).innerJoin(I, eq(I.id, G.invitationId)).leftJoin(S, eq(S.id, I.shareId))
    .where(and(inArray(I.token, tokens), isNull(G.claimedAt), eq(I.accessPolicy, "paid-pair-v2"), isNull(I.revokedAt), gt(I.expiresAt, new Date()), isNull(S.revokedAt)));
  return new Set(rows.map(({ token }) => token));
}

/** The host's view: which of their invitations are covered, and how many gifts wait per language. */
export async function hostGiftState(visitorId: string) {
  const rows = await db().select({ locale: G.locale, invitation: I, shareRevokedAt: S.revokedAt })
    .from(G).leftJoin(I, eq(I.id, G.invitationId)).leftJoin(S, eq(S.id, I.shareId))
    .where(and(eq(G.visitorId, visitorId), isNull(G.claimedAt)));
  const covered: string[] = [];
  const available: Record<Locale, number> = { zh: 0, en: 0 };
  for (const row of rows) {
    if (row.invitation && isOpen(row.invitation, row.shareRevokedAt)) covered.push(row.invitation.id);
    else available[row.locale as Locale] += 1;
  }
  return { covered, available };
}

/** 请 TA is bought in the invitation's language, at that language's price and provider. */
export function giftCheckout(locale: Locale) {
  const mode = paymentModeFor(locale);
  return { priceLabel: priceLabelFor(locale), mode, networks: mode === "crypto" ? cryptoNetworks() : [] };
}
