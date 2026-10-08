import "server-only";
import { and, eq, gt, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPairingEligibility } from "@/lib/pairing-eligibility";
import { ShareError, type ShareEvent } from "@/lib/share-policy";
import { ensureShareVisitor, lockVisitor } from "@/lib/share-request";
import type { Locale } from "@/lib/i18n/locale";

type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
const DAY = 86_400_000;
const paidPolicy = "paid-pair-v2";

// Independent invitations have no card. A linked invitation still inherits the card's withdrawal.
function availableParentShare() {
  return or(isNull(schema.comparisonInvitations.shareId), and(isNotNull(schema.resultShares.id), isNull(schema.resultShares.revokedAt)));
}
function paidHostHasAccess() {
  return sql`exists (select 1 from ${schema.results} where ${schema.results.id} = ${schema.comparisonInvitations.resultId}
    and ${schema.results.visitorId} = ${schema.comparisonInvitations.visitorId} and ${schema.results.unlockedAt} is not null)`;
}

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
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    let shareId: string | null = null;
    let invitationId: string | null = null;
    let pairId: string | null = null;
    let ownerResultId: string | null = null;
    let eligibilityAtEvent: (typeof schema.shareEvents.$inferInsert)["eligibilityAtEvent"] = null;
    let dedupeKey = `${visitorId}:${event.eventId}`;

    if (event.eventName === "pairing_benefit_viewed" || event.eventName === "pairing_entry_clicked" || event.eventName === "pairing_checkout_opened") {
      // Never trust a claimed entitlement or a result ID without checking its owner.
      eligibilityAtEvent = await getPairingEligibility(event.resultId, visitorId, tx);
      ownerResultId = event.resultId;
      if (event.eventName !== "pairing_entry_clicked") dedupeKey = `${event.eventName}:${visitorId}:${ownerResultId}:${day}`;
    } else if (event.eventName === "pairing_resume_clicked") {
      const [continuation] = await tx.select({ resultId: schema.comparisonContinuations.resultId, invitationId: schema.comparisonContinuations.invitationId })
        .from(schema.comparisonContinuations)
        .innerJoin(schema.comparisonInvitations, eq(schema.comparisonContinuations.invitationId, schema.comparisonInvitations.id))
        .leftJoin(schema.resultShares, eq(schema.comparisonInvitations.shareId, schema.resultShares.id))
        .where(and(eq(schema.comparisonContinuations.id, event.continuationId), eq(schema.comparisonContinuations.visitorId, visitorId),
          isNull(schema.comparisonContinuations.completedAt), gt(schema.comparisonContinuations.expiresAt, now),
          eq(schema.comparisonInvitations.accessPolicy, paidPolicy), isNull(schema.comparisonInvitations.revokedAt),
          gt(schema.comparisonInvitations.expiresAt, now), availableParentShare(), paidHostHasAccess()));
      if (!continuation) throw new ShareError(404, "NOT_FOUND");
      ownerResultId = continuation.resultId;
      invitationId = continuation.invitationId;
      eligibilityAtEvent = await getPairingEligibility(ownerResultId, visitorId, tx);
    } else if (event.eventName === "share_quiz_started") {
      const a = await tx.query.referralAttributions.findFirst({ where: and(eq(schema.referralAttributions.visitorId, visitorId), gt(schema.referralAttributions.expiresAt, now), isNull(schema.referralAttributions.firstResultId)) });
      if (!a) return;
      shareId = a.shareId;
      invitationId = a.invitationId;
      dedupeKey = `quiz:${visitorId}:${a.firstTouchAt.toISOString()}`;
      await tx.update(schema.referralAttributions).set({ quizStartedAt: now }).where(and(eq(schema.referralAttributions.visitorId, visitorId), isNull(schema.referralAttributions.quizStartedAt)));
    } else if (event.eventName === "comparison_viewed") {
      const [pair] = await tx.select({ id: schema.comparisons.id, invitationId: schema.comparisonInvitations.id,
        hostResultId: schema.comparisonInvitations.resultId, guestResultId: schema.comparisons.guestResultId,
        host: schema.comparisons.hostVisitorId, guest: schema.comparisons.guestVisitorId,
        accessPolicy: schema.comparisons.accessPolicy, invitationPolicy: schema.comparisonInvitations.accessPolicy })
        .from(schema.comparisons)
        .innerJoin(schema.comparisonInvitations, eq(schema.comparisons.invitationId, schema.comparisonInvitations.id))
        .leftJoin(schema.resultShares, eq(schema.resultShares.id, schema.comparisonInvitations.shareId))
        .where(and(eq(schema.comparisons.id, event.pairId), isNull(schema.comparisons.revokedAt), isNull(schema.comparisonInvitations.revokedAt), availableParentShare()));
      if (!pair || (pair.host !== visitorId && pair.guest !== visitorId)) throw new ShareError(404, "NOT_FOUND");
      if (pair.accessPolicy === paidPolicy) {
        if (pair.invitationPolicy !== paidPolicy
          || await getPairingEligibility(pair.hostResultId, pair.host, tx) !== "eligible"
          || await getPairingEligibility(pair.guestResultId, pair.guest, tx) !== "eligible") throw new ShareError(404, "NOT_FOUND");
      }
      pairId = pair.id;
      invitationId = pair.invitationId;
      dedupeKey = `pair:${pairId}:${visitorId}:${day}`;
    } else {
      let source: { id: string; visitorId: string; locale: string } | undefined;
      if (event.surface === "invitation") {
        [source] = await tx.select({ id: schema.comparisonInvitations.id, visitorId: schema.comparisonInvitations.visitorId, locale: schema.comparisonInvitations.locale })
          .from(schema.comparisonInvitations)
          .leftJoin(schema.resultShares, eq(schema.comparisonInvitations.shareId, schema.resultShares.id))
          .where(and(eq(schema.comparisonInvitations.token, event.shareToken), eq(schema.comparisonInvitations.accessPolicy, paidPolicy),
            isNull(schema.comparisonInvitations.revokedAt), gt(schema.comparisonInvitations.expiresAt, now), availableParentShare(), paidHostHasAccess()));
        if (source) invitationId = source.id;
      } else {
        source = await tx.query.resultShares.findFirst({ where: and(eq(schema.resultShares.token, event.shareToken), isNull(schema.resultShares.revokedAt)), columns: { id: true, visitorId: true, locale: true } });
        if (source) shareId = source.id;
      }
      if (!source) throw new ShareError(404, "NOT_FOUND");
      locale = source.locale as Locale;
      if (event.eventName === "share_browser_visible") {
        if (source.visitorId === visitorId) return;
        dedupeKey = `view:${invitationId ? "invitation" : "share"}:${source.id}:${visitorId}:${day}`;
        const [existingResult] = await tx.select({ id: schema.results.id }).from(schema.results).where(eq(schema.results.visitorId, visitorId)).limit(1);
        if (!existingResult) {
          const a = schema.referralAttributions;
          const window = { shareId, invitationId, firstTouchAt: now, expiresAt: new Date(now.getTime() + 7 * DAY), quizStartedAt: null };
          await tx.insert(a).values({ visitorId, ...window })
            .onConflictDoUpdate({ target: a.visitorId, set: window, setWhere: and(isNull(a.firstResultId), lte(a.expiresAt, now)) });
        }
      }
    }
    await tx.insert(schema.shareEvents).values({ id: event.eventId, eventName: event.eventName, actorVisitorId: visitorId,
      shareId, invitationId, pairId, ownerResultId, eligibilityAtEvent, locale, dedupeKey,
      surface: event.surface, channel: event.channel, occurredAt: now, ruleVersion: paidPolicy }).onConflictDoNothing();
  });
}
