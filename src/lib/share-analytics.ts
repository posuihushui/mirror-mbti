import "server-only";
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ShareError, type ShareEvent } from "@/lib/share-policy";
import { ensureShareVisitor, lockVisitor } from "@/lib/share-request";
import type { Locale } from "@/lib/i18n/locale";

type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
export async function claimFirstReferral(tx: Tx, visitorId: string, resultId: string, now: Date) {
  // A savepoint is essential: catching a failed PostgreSQL statement alone leaves the transaction aborted.
  try {
    await tx.transaction(async (optional) => {
      await optional.execute(sql`set local statement_timeout = '1500ms'`);
      await optional.update(schema.referralAttributions).set({ firstResultId: resultId, completedAt: now })
        .where(and(eq(schema.referralAttributions.visitorId, visitorId), isNull(schema.referralAttributions.firstResultId), gt(schema.referralAttributions.expiresAt, now)));
    });
  } catch (error) { console.error("[sharing] attribution skipped", error instanceof Error ? error.name : "UnknownError"); }
}
export async function recordShareEvent(visitorId: string, event: ShareEvent, locale: Locale) {
  await ensureShareVisitor(visitorId);
  return db().transaction(async (tx) => {
    await lockVisitor(tx, visitorId);
    const now = new Date(); let shareId: string | null = null; let pairId: string | null = null;
    let dedupeKey = `${visitorId}:${event.eventId}`;
    if (event.eventName === "share_quiz_started") {
      const a = await tx.query.referralAttributions.findFirst({ where: and(eq(schema.referralAttributions.visitorId, visitorId), gt(schema.referralAttributions.expiresAt, now), isNull(schema.referralAttributions.firstResultId)) });
      if (!a) return;
      shareId = a.shareId; dedupeKey = `quiz:${visitorId}:${a.firstTouchAt.toISOString()}`;
      await tx.update(schema.referralAttributions).set({ quizStartedAt: now }).where(and(eq(schema.referralAttributions.visitorId, visitorId), isNull(schema.referralAttributions.quizStartedAt)));
    } else if (event.eventName === "comparison_viewed") {
      const [pair] = await tx.select({ id: schema.comparisons.id, shareId: schema.comparisonInvitations.shareId, host: schema.comparisons.hostVisitorId, guest: schema.comparisons.guestVisitorId }).from(schema.comparisons)
        .innerJoin(schema.comparisonInvitations, eq(schema.comparisons.invitationId, schema.comparisonInvitations.id)).innerJoin(schema.resultShares, eq(schema.resultShares.id, schema.comparisonInvitations.shareId))
        .where(and(eq(schema.comparisons.id, event.pairId), isNull(schema.comparisons.revokedAt), isNull(schema.comparisonInvitations.revokedAt), isNull(schema.resultShares.revokedAt)));
      if (!pair || (pair.host !== visitorId && pair.guest !== visitorId)) throw new ShareError(404, "NOT_FOUND");
      pairId = pair.id; shareId = pair.shareId; dedupeKey = `pair:${pairId}:${visitorId}:${now.toISOString().slice(0, 10)}`;
    } else {
      let share = event.surface === "invitation" ? undefined : await tx.query.resultShares.findFirst({ where: and(eq(schema.resultShares.token, event.shareToken), isNull(schema.resultShares.revokedAt)), columns: { id: true, visitorId: true, locale: true } });
      if (!share && event.surface === "invitation") {
        const [invitation] = await tx.select({ id: schema.resultShares.id, visitorId: schema.resultShares.visitorId, locale: schema.comparisonInvitations.locale }).from(schema.comparisonInvitations)
          .innerJoin(schema.resultShares, eq(schema.comparisonInvitations.shareId, schema.resultShares.id)).where(and(eq(schema.comparisonInvitations.token, event.shareToken), isNull(schema.comparisonInvitations.revokedAt), gt(schema.comparisonInvitations.expiresAt, now), isNull(schema.resultShares.revokedAt)));
        share = invitation;
      }
      if (!share) throw new ShareError(404, "NOT_FOUND");
      shareId = share.id; locale = share.locale as Locale;
      if (event.eventName === "share_browser_visible") {
        if (share.visitorId === visitorId) return;
        dedupeKey = `view:${share.id}:${visitorId}:${now.toISOString().slice(0, 10)}`;
        const [existingResult] = await tx.select({ id: schema.results.id }).from(schema.results).where(eq(schema.results.visitorId, visitorId)).limit(1);
        if (!existingResult) {
          const a = schema.referralAttributions;
          await tx.insert(a).values({ visitorId, shareId: share.id, firstTouchAt: now, expiresAt: new Date(now.getTime() + 7 * 86400000) })
            .onConflictDoUpdate({ target: a.visitorId, set: { shareId: share.id, firstTouchAt: now, expiresAt: new Date(now.getTime() + 7 * 86400000), quizStartedAt: null }, setWhere: and(isNull(a.firstResultId), lte(a.expiresAt, now)) });
        }
      }
    }
    await tx.insert(schema.shareEvents).values({ id: event.eventId, eventName: event.eventName, actorVisitorId: visitorId, shareId, pairId, locale, dedupeKey, surface: event.surface, channel: event.channel, occurredAt: now }).onConflictDoNothing();
  });
}
