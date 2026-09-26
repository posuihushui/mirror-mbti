import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema, type Db } from "@/db";
import { ShareError } from "@/lib/share-policy";

export type PairingEligibility = "eligible" | "locked" | "syncing";
export type PairingTx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
type Reader = Db | PairingTx;

/**
 * Read only. Paid legacy/balanced reports keep their entitlement; every unpaid result is simply locked.
 * Only `report` orders unlock the result they carry: a host's `pair-gift` order also carries their own result.
 */
export async function getPairingEligibility(resultId: string, visitorId: string, reader: Reader = db()): Promise<PairingEligibility> {
  const result = await reader.query.results.findFirst({ where: and(eq(schema.results.id, resultId), eq(schema.results.visitorId, visitorId)), columns: { unlockedAt: true } });
  if (!result) throw new ShareError(404, "NOT_FOUND");
  if (result.unlockedAt) return "eligible";
  const paid = await reader.query.orders.findFirst({ where: and(eq(schema.orders.resultId, resultId), eq(schema.orders.visitorId, visitorId), eq(schema.orders.kind, "report"), eq(schema.orders.status, "paid")), columns: { id: true } });
  if (paid) return "syncing";
  return "locked";
}
export async function requirePairingEligibility(resultId: string, visitorId: string, reader: Reader = db()) {
  const state = await getPairingEligibility(resultId, visitorId, reader);
  if (state === "syncing") throw new ShareError(409, "PAIRING_ENTITLEMENT_SYNCING");
  if (state !== "eligible") throw new ShareError(403, "PAIRING_UNLOCK_REQUIRED");
}

/** Explicit payment-status reconciliation only. Never rewrites an existing entitlement. */
export async function reconcilePaidResult(resultId: string, visitorId: string) {
  return db().transaction(async tx => {
    const result = await tx.query.results.findFirst({ where: and(eq(schema.results.id, resultId), eq(schema.results.visitorId, visitorId)), columns: { unlockedAt: true } });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    if (result.unlockedAt) return;
    const order = await tx.query.orders.findFirst({ where: and(eq(schema.orders.resultId, resultId), eq(schema.orders.visitorId, visitorId), eq(schema.orders.kind, "report"), eq(schema.orders.status, "paid")), orderBy: [asc(schema.orders.paidAt), asc(schema.orders.id)], columns: { id: true, paidAt: true } });
    if (!order) return;
    await tx.update(schema.results).set({ unlockedAt: order.paidAt ?? new Date(), unlockOrderId: order.id })
      .where(and(eq(schema.results.id, resultId), eq(schema.results.visitorId, visitorId), isNull(schema.results.unlockedAt)));
  });
}
