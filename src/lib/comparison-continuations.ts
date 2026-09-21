import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { href, type Locale } from "@/lib/i18n/locale";
import { questionnaireLocale } from "@/lib/questionnaires";
import { invitationParentOpen, lockInvitationForToken } from "@/lib/comparisons";
import { getPairingEligibility, requirePairingEligibility } from "@/lib/pairing-eligibility";
import { continuationInputSchema, ShareError } from "@/lib/share-policy";
const C = schema.comparisonContinuations, I = schema.comparisonInvitations, S = schema.resultShares, P = schema.comparisons, R = schema.results;
function continueUrl(locale: Locale, token: string, resultId: string) { return href(locale, `/t/${token}/join?result=${resultId}`); }

/** An intent is separate from payment and consent. Only its signed owner may register/read it. */
export async function registerComparisonContinuation(visitorId: string, raw: z.infer<typeof continuationInputSchema>) {
  const input = continuationInputSchema.parse(raw);
  return db().transaction(async tx => {
    const invitation = await lockInvitationForToken(tx, input.invitationToken);
    if (invitation.visitorId === visitorId) throw new ShareError(409, "SELF_COMPARISON");
    const result = await tx.query.results.findFirst({ where: and(eq(R.id, input.resultId), eq(R.visitorId, visitorId)), columns: { id: true, questionnaireId: true } });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    const [pair] = await tx.select().from(P).where(and(eq(P.invitationId, invitation.id), eq(P.guestVisitorId, visitorId))).for("update");
    if (pair) {
      if (pair.revokedAt) throw new ShareError(410, "INVITATION_UNAVAILABLE");
      if (pair.accessPolicy === "paid-pair-v2") {
        await requirePairingEligibility(invitation.resultId, invitation.visitorId, tx);
        await requirePairingEligibility(pair.guestResultId, visitorId, tx);
      }
      await tx.update(C).set({ completedAt: new Date(), updatedAt: new Date() }).where(and(eq(C.invitationId, invitation.id), eq(C.visitorId, visitorId), isNull(C.completedAt)));
      return { status: "completed" as const, pairUrl: href(pair.locale as Locale, `/compare/${pair.id}`) };
    }
    if (invitation.accessPolicy !== "paid-pair-v2") throw new ShareError(409, "INVITATION_UPGRADE_REQUIRED");
    if (invitation.expiresAt <= new Date()) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    await requirePairingEligibility(invitation.resultId, invitation.visitorId, tx);
    const locale = questionnaireLocale(result.questionnaireId), now = new Date();
    const expiresAt = new Date(Math.min(+invitation.expiresAt, +now + 30 * 86400000));
    const [item] = await tx.insert(C).values({ id: randomUUID(), visitorId, invitationId: invitation.id, resultId: result.id, expiresAt })
      .onConflictDoUpdate({ target: [C.visitorId, C.invitationId, C.resultId], set: { updatedAt: now } }).returning();
    // SQL failure is isolated: intent persistence and normal testing must remain usable.
    try {
      await tx.transaction(async savepoint => {
        const eligibilityAtEvent = await getPairingEligibility(result.id, visitorId, savepoint);
        await savepoint.insert(schema.shareEvents).values({ id: randomUUID(), eventName: "pairing_result_selected", invitationId: invitation.id, ownerResultId: result.id,
          actorVisitorId: visitorId, locale, eligibilityAtEvent, ruleVersion: "paid-pair-v2", channel: "unknown", surface: "invitation",
          dedupeKey: `selected:${visitorId}:${invitation.id}:${result.id}` }).onConflictDoNothing();
      });
    } catch { console.warn("[pairing] intent analytics unavailable"); }
    return { status: "pending" as const, id: item.id, expiresAt: item.expiresAt.toISOString(), continueUrl: continueUrl(locale, invitation.token, result.id) };
  });
}
export async function listComparisonContinuations(visitorId: string, resultId?: string) {
  const rows = await db().select({ id: C.id, resultId: C.resultId, token: I.token, expiresAt: C.expiresAt, questionnaireId: R.questionnaireId })
    .from(C).innerJoin(I, eq(I.id, C.invitationId)).leftJoin(S, eq(S.id, I.shareId)).innerJoin(R, and(eq(R.id, C.resultId), eq(R.visitorId, visitorId)))
    .where(and(eq(C.visitorId, visitorId), resultId ? eq(C.resultId, resultId) : undefined, isNull(C.completedAt), gt(C.expiresAt, new Date()),
      eq(I.accessPolicy, "paid-pair-v2"), isNull(I.revokedAt), gt(I.expiresAt, new Date()), invitationParentOpen,
      sql`not exists (select 1 from comparisons p where p.invitation_id = ${I.id} and p.guest_visitor_id = ${visitorId})`,
      sql`exists (select 1 from results h where h.id = ${I.resultId} and h.visitor_id = ${I.visitorId} and h.unlocked_at is not null)`))
    .orderBy(desc(C.createdAt), desc(C.id)).limit(100);
  return rows.map(row => ({ id: row.id, invitationToken: row.token, resultId: row.resultId, locale: questionnaireLocale(row.questionnaireId),
    continueUrl: continueUrl(questionnaireLocale(row.questionnaireId), row.token, row.resultId), expiresAt: row.expiresAt.toISOString() }));
}
export async function deleteComparisonContinuation(id: string, visitorId: string) {
  z.uuid().parse(id);
  // Unknown/other-owner IDs share the same idempotent empty result and reveal no record.
  await db().delete(C).where(and(eq(C.id, id), eq(C.visitorId, visitorId)));
}

export async function hasUnavailableComparisonContinuation(visitorId: string, resultId: string, validIds: string[]) {
  const pending = await db().select({ id: C.id }).from(C).where(and(eq(C.visitorId, visitorId), eq(C.resultId, resultId), isNull(C.completedAt))).limit(100);
  return pending.some(row => !validIds.includes(row.id));
}
