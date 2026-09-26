import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { appUrl } from "@/lib/env";
import { href, type Locale } from "@/lib/i18n/locale";
import { getQuestionnaire, questionnaireLocale } from "@/lib/questionnaires";
import { generateCompareContent, generateRelationshipContent } from "@/lib/compare-content";
import { COMPARE_CONTENT_VERSION, COMPARE_V3_CONTENT_VERSION, COMPARE_HOST_CONSENT_VERSION, COMPARE_GUEST_CONSENT_VERSION, type CompareSnapshot } from "@/lib/compare-types";
import { getPairingEligibility, requirePairingEligibility, type PairingTx as Tx } from "@/lib/pairing-eligibility";
import { attachAvailableGift, claimGift, hostGiftState } from "@/lib/pair-gifts";
import { ShareError, invitationInputSchema, comparisonInputSchema, shareTokenSchema } from "@/lib/share-policy";

type Invitation = typeof schema.comparisonInvitations.$inferSelect;
type Pair = typeof schema.comparisons.$inferSelect;
const I = schema.comparisonInvitations, P = schema.comparisons, S = schema.resultShares, R = schema.results, C = schema.comparisonContinuations;
const uuid = z.uuid();
const resultIdFormat = /^[A-Za-z0-9_-]{12}$/;
const resultColumns = { id: true, type: true, balanced: true, questionnaireId: true, createdAt: true } as const;
export const invitationParentOpen = or(isNull(I.shareId), and(isNull(S.revokedAt), sql`${S.id} is not null`));
const paidPairReadable = or(eq(P.accessPolicy, "legacy-free-v1"), and(
  sql`exists (select 1 from results h where h.id = ${I.resultId} and h.visitor_id = ${P.hostVisitorId} and h.unlocked_at is not null)`,
  sql`exists (select 1 from results g where g.id = ${P.guestResultId} and g.visitor_id = ${P.guestVisitorId} and g.unlocked_at is not null)`,
));
function snapshotFromResult(row: Pick<typeof R.$inferSelect, "type" | "balanced" | "questionnaireId" | "createdAt">): CompareSnapshot {
  const questionnaire = getQuestionnaire(row.questionnaireId);
  if (!questionnaire || !/^[EI][SN][TF][JP]$/.test(row.type) || row.balanced.length !== 4) throw new ShareError(503, "SHARE_UNAVAILABLE");
  return { categories: { EI: row.balanced[0] ? "balanced" : row.type[0] as "E" | "I", SN: row.balanced[1] ? "balanced" : row.type[1] as "S" | "N", TF: row.balanced[2] ? "balanced" : row.type[2] as "T" | "F", JP: row.balanced[3] ? "balanced" : row.type[3] as "J" | "P" }, questionnaireId: questionnaire.id, createdAt: row.createdAt.toISOString() };
}
function invitationView(row: Invitation) {
  return { id: row.id, token: row.token, url: `${appUrl()}${href(row.locale as Locale, `/t/${row.token}`)}`, locale: row.locale as Locale,
    resultId: row.resultId, shareId: row.shareId, accessPolicy: row.accessPolicy, snapshot: row.publicSnapshot, relationship: row.relationship,
    createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt.toISOString(), revokedAt: row.revokedAt?.toISOString() ?? null };
}
function pairView(row: Pair, visitorId: string) {
  return { id: row.id, url: href(row.locale as Locale, `/compare/${row.id}`), locale: row.locale as Locale,
    hostSnapshot: row.hostSnapshot, guestSnapshot: row.guestSnapshot, outputSnapshot: row.outputSnapshot, accessPolicy: row.accessPolicy, relationship: row.relationship,
    role: row.hostVisitorId === visitorId ? "host" as const : "guest" as const, createdAt: row.createdAt.toISOString() };
}
async function lockShare(tx: Tx, shareId: string | null) {
  if (!shareId) return null;
  const [share] = await tx.select().from(S).where(eq(S.id, shareId)).for("update");
  if (!share) throw new ShareError(404, "NOT_FOUND");
  return share;
}
async function lockInvitation(tx: Tx, invitationId: string) {
  const [invitation] = await tx.select().from(I).where(eq(I.id, invitationId)).for("update");
  if (!invitation) throw new ShareError(404, "NOT_FOUND");
  return invitation;
}
/** Immutable lookup keys only, then lock ancestors in share → invitation order and recheck. */
export async function lockInvitationForToken(tx: Tx, token: string) {
  const key = await tx.query.comparisonInvitations.findFirst({ where: eq(I.token, token), columns: { id: true, shareId: true } });
  if (!key) throw new ShareError(410, "INVITATION_UNAVAILABLE");
  const share = await lockShare(tx, key.shareId);
  const invitation = await lockInvitation(tx, key.id);
  if (share?.revokedAt || invitation.revokedAt) throw new ShareError(410, "INVITATION_UNAVAILABLE");
  return invitation;
}
export async function invitationOptions(resultId: string | undefined, visitorId: string, shareId?: string) {
  if (shareId) {
    if (!uuid.safeParse(shareId).success) throw new ShareError(404, "NOT_FOUND");
    const share = await db().query.resultShares.findFirst({ where: and(eq(S.id, shareId), eq(S.visitorId, visitorId), isNull(S.revokedAt)), columns: { resultId: true } });
    if (!share || (resultId && resultId !== share.resultId)) throw new ShareError(404, "NOT_FOUND");
    resultId = share.resultId;
  }
  const result = resultId ? await getComparisonResult(resultId, visitorId) : null;
  if (!result) throw new ShareError(404, "NOT_FOUND");
  await requirePairingEligibility(result.id, visitorId);
  // One open invitation per relationship: the sheet shows the one for the relationship chosen.
  const active = await db().select({ invitation: I }).from(I).leftJoin(S, eq(S.id, I.shareId)).where(and(eq(I.visitorId, visitorId), eq(I.resultId, result.id), eq(I.accessPolicy, "paid-pair-v2"), isNull(I.revokedAt), invitationParentOpen, gt(I.expiresAt, new Date()))).orderBy(desc(I.createdAt)).limit(10);
  const gifts = await hostGiftState(visitorId);
  return { resultId: result.id, locale: result.locale, snapshot: result.snapshot,
    activeInvitations: active.map(({ invitation }) => ({ ...invitationView(invitation), covered: gifts.covered.includes(invitation.id) })),
    availableGifts: gifts.available[result.locale] };
}
export async function getComparisonResult(resultId: string, visitorId: string) {
  if (!resultIdFormat.test(resultId)) return null;
  const row = await db().query.results.findFirst({ where: and(eq(R.id, resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
  return row ? { id: row.id, snapshot: snapshotFromResult(row), locale: questionnaireLocale(row.questionnaireId), eligibility: await getPairingEligibility(row.id, visitorId) } : null;
}
export async function listComparisonResults(visitorId: string) {
  const rows = await db().query.results.findMany({ where: eq(R.visitorId, visitorId), columns: resultColumns, orderBy: [desc(R.createdAt), desc(R.id)], limit: 100 });
  // The owner's own results: the type is shown to them alone, on their private center page.
  return Promise.all(rows.map(async row => ({ id: row.id, type: row.type, snapshot: snapshotFromResult(row), locale: questionnaireLocale(row.questionnaireId), eligibility: await getPairingEligibility(row.id, visitorId) })));
}
export async function createComparisonInvitation(visitorId: string, raw: z.infer<typeof invitationInputSchema>) {
  const input = invitationInputSchema.parse(raw);
  if (input.consentVersion !== COMPARE_HOST_CONSENT_VERSION) throw new ShareError(409, "CONSENT_REFRESH_REQUIRED");
  return db().transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`comparison-invitation:${visitorId}`}, 0))`);
    const share = await lockShare(tx, input.shareId ?? null);
    if (share && (share.visitorId !== visitorId || (input.resultId && input.resultId !== share.resultId))) throw new ShareError(404, "NOT_FOUND");
    if (share?.revokedAt) throw new ShareError(410, "SHARE_CLOSED");
    const resultId = input.resultId ?? share?.resultId;
    if (!resultId) throw new ShareError(404, "NOT_FOUND");
    await requirePairingEligibility(resultId, visitorId, tx);
    const relationship = input.relationship ?? null;
    const hash = createHash("sha256").update(JSON.stringify({ resultId, shareId: share?.id ?? null, consentVersion: input.consentVersion, accessPolicy: "paid-pair-v2", hostNote: input.hostNote ?? null, relationship })).digest("hex");
    const old = await tx.query.comparisonInvitations.findFirst({ where: and(eq(I.visitorId, visitorId), eq(I.requestId, input.requestId)) });
    if (old) {
      if (old.requestHash !== hash) throw new ShareError(409, "IDEMPOTENCY_CONFLICT");
      if (old.revokedAt || old.expiresAt <= new Date()) throw new ShareError(410, "INVITATION_UNAVAILABLE");
      const [gift] = await tx.select({ id: schema.pairGifts.id }).from(schema.pairGifts).where(and(eq(schema.pairGifts.invitationId, old.id), isNull(schema.pairGifts.claimedAt))).limit(1);
      return { created: false, item: { ...invitationView(old), covered: Boolean(gift) } };
    }
    const [active] = await tx.select({ id: I.id }).from(I).leftJoin(S, eq(S.id, I.shareId)).where(and(eq(I.visitorId, visitorId), eq(I.resultId, resultId), relationship ? eq(I.relationship, relationship) : isNull(I.relationship), eq(I.accessPolicy, "paid-pair-v2"), isNull(I.revokedAt), invitationParentOpen, gt(I.expiresAt, new Date()))).limit(1);
    if (active) throw new ShareError(409, "ACTIVE_INVITATION");
    const result = await tx.query.results.findFirst({ where: and(eq(R.id, resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    const now = new Date();
    const [row] = await tx.insert(I).values({ id: randomUUID(), token: randomBytes(24).toString("base64url"), shareId: share?.id ?? null, visitorId,
      resultId: result.id, locale: questionnaireLocale(result.questionnaireId), publicSnapshot: snapshotFromResult(result), hostNote: input.hostNote ?? null, relationship, contentVersion: relationship ? COMPARE_CONTENT_VERSION : COMPARE_V3_CONTENT_VERSION,
      accessPolicy: "paid-pair-v2", consentVersion: input.consentVersion, requestId: input.requestId, requestHash: hash, createdAt: now, expiresAt: new Date(+now + 30 * 86400000) }).returning();
    // An unused gift from an earlier invitation in this language moves onto the new one.
    const covered = await attachAvailableGift(tx, row);
    return { created: true, item: { ...invitationView(row), covered } };
  });
}
export async function getInvitationState(token: string): Promise<"active" | "legacy" | "unavailable"> {
  if (!shareTokenSchema.safeParse(token).success) return "unavailable";
  const [row] = await db().select({ accessPolicy: I.accessPolicy }).from(I).leftJoin(S, eq(S.id, I.shareId)).where(and(eq(I.token, token), isNull(I.revokedAt), invitationParentOpen, gt(I.expiresAt, new Date()))).limit(1);
  return !row ? "unavailable" : row.accessPolicy === "legacy-free-v1" ? "legacy" : "active";
}
export async function getPublicInvitation(token: string) {
  if (!shareTokenSchema.safeParse(token).success) return null;
  const [row] = await db().select({ locale: I.locale, snapshot: I.publicSnapshot, hostNote: I.hostNote, relationship: I.relationship, expiresAt: I.expiresAt,
    // Whether the host covered a participant's report: a yes/no, never who paid or how much.
    covered: sql<boolean>`exists (select 1 from pair_gifts g where g.invitation_id = ${I.id} and g.claimed_at is null)` }).from(I).leftJoin(S, eq(S.id, I.shareId))
    .where(and(eq(I.token, token), eq(I.accessPolicy, "paid-pair-v2"), isNull(I.revokedAt), invitationParentOpen, gt(I.expiresAt, new Date()))).limit(1);
  return row ? { ...row, locale: row.locale as Locale, expiresAt: row.expiresAt.toISOString() } : null;
}
async function completeContinuations(tx: Tx, invitationId: string, visitorId: string) {
  await tx.update(C).set({ completedAt: new Date(), updatedAt: new Date() }).where(and(eq(C.invitationId, invitationId), eq(C.visitorId, visitorId), isNull(C.completedAt)));
}
export async function joinComparison(visitorId: string, raw: z.infer<typeof comparisonInputSchema>) {
  const input = comparisonInputSchema.parse(raw);
  if (input.consentVersion !== COMPARE_GUEST_CONSENT_VERSION) throw new ShareError(409, "CONSENT_REFRESH_REQUIRED");
  return db().transaction(async tx => {
    const invitation = await lockInvitationForToken(tx, input.invitationToken);
    if (invitation.visitorId === visitorId) throw new ShareError(409, "SELF_COMPARISON");
    const [existing] = await tx.select().from(P).where(and(eq(P.invitationId, invitation.id), eq(P.guestVisitorId, visitorId))).for("update");
    if (existing) {
      if (existing.revokedAt) throw new ShareError(410, "INVITATION_UNAVAILABLE");
      if (existing.guestResultId !== input.resultId) throw new ShareError(409, "ALREADY_JOINED");
      if (existing.accessPolicy === "paid-pair-v2") {
        await requirePairingEligibility(invitation.resultId, invitation.visitorId, tx);
        await requirePairingEligibility(input.resultId, visitorId, tx);
      }
      await completeContinuations(tx, invitation.id, visitorId);
      return { created: false, item: pairView(existing, visitorId) };
    }
    if (invitation.accessPolicy !== "paid-pair-v2") throw new ShareError(409, "INVITATION_UPGRADE_REQUIRED");
    if (invitation.expiresAt <= new Date()) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    await requirePairingEligibility(invitation.resultId, invitation.visitorId, tx);
    // A still-locked participant may join on the host's gift; joining is the explicit consent it waits for.
    const guestState = await getPairingEligibility(input.resultId, visitorId, tx);
    if (guestState === "locked" && !(await claimGift(tx, invitation.id, visitorId, input.resultId))) throw new ShareError(403, "PAIRING_UNLOCK_REQUIRED");
    if (guestState === "syncing") throw new ShareError(409, "PAIRING_ENTITLEMENT_SYNCING");
    const result = await tx.query.results.findFirst({ where: and(eq(R.id, input.resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    const guestSnapshot = snapshotFromResult(result), locale = invitation.locale as Locale, relationship = invitation.relationship;
    const [row] = await tx.insert(P).values({ id: randomUUID(), invitationId: invitation.id, hostVisitorId: invitation.visitorId,
      guestVisitorId: visitorId, guestResultId: result.id, hostSnapshot: invitation.publicSnapshot, guestSnapshot, accessPolicy: "paid-pair-v2",
      // Invitations made before relationships existed keep producing the v3 reading they promised.
      contentVersion: relationship ? COMPARE_CONTENT_VERSION : COMPARE_V3_CONTENT_VERSION, relationship, locale,
      outputSnapshot: relationship ? generateRelationshipContent(invitation.publicSnapshot, guestSnapshot, relationship, locale) : generateCompareContent(invitation.publicSnapshot, guestSnapshot, locale),
      guestConsentVersion: input.consentVersion }).returning();
    await completeContinuations(tx, invitation.id, visitorId);
    return { created: true, item: pairView(row, visitorId) };
  });
}
export async function getOwnedComparison(id: string, visitorId: string) {
  if (!uuid.safeParse(id).success) return null;
  const [row] = await db().select({ pair: P }).from(P).innerJoin(I, eq(P.invitationId, I.id)).leftJoin(S, eq(I.shareId, S.id))
    .where(and(eq(P.id, id), or(eq(P.hostVisitorId, visitorId), eq(P.guestVisitorId, visitorId)), isNull(P.revokedAt), isNull(I.revokedAt), invitationParentOpen, paidPairReadable)).limit(1);
  return row ? pairView(row.pair, visitorId) : null;
}
export async function findOwnedComparisonForInvitation(token: string, visitorId: string) {
  if (!shareTokenSchema.safeParse(token).success) return null;
  const [row] = await db().select({ pair: P }).from(P).innerJoin(I, eq(P.invitationId, I.id)).leftJoin(S, eq(I.shareId, S.id))
    .where(and(eq(I.token, token), eq(P.guestVisitorId, visitorId), isNull(P.revokedAt), isNull(I.revokedAt), invitationParentOpen, paidPairReadable)).limit(1);
  return row ? pairView(row.pair, visitorId) : null;
}
export async function listOwnedComparisons(visitorId: string) {
  // Metadata only: a revoked guide's private frozen content never reaches management HTML/RSC.
  const rows = await db().select({ id: P.id, invitationId: P.invitationId, locale: P.locale, relationship: P.relationship, createdAt: P.createdAt, revokedAt: P.revokedAt, invitationRevokedAt: I.revokedAt, shareRevokedAt: S.revokedAt, accessPolicy: P.accessPolicy }).from(P).innerJoin(I, eq(P.invitationId, I.id)).leftJoin(S, eq(I.shareId, S.id))
    .where(or(eq(P.hostVisitorId, visitorId), eq(P.guestVisitorId, visitorId))).orderBy(desc(P.createdAt), desc(P.id)).limit(100);
  const [invitations, gifts] = await Promise.all([db().query.comparisonInvitations.findMany({ where: eq(I.visitorId, visitorId), orderBy: [desc(I.createdAt), desc(I.id)], limit: 100 }), hostGiftState(visitorId)]);
  return { items: rows.map(row => ({ id: row.id, invitationId: row.invitationId, locale: row.locale as Locale, relationship: row.relationship, url: href(row.locale as Locale, `/compare/${row.id}`), createdAt: row.createdAt.toISOString(), revokedAt: (row.revokedAt ?? row.invitationRevokedAt ?? row.shareRevokedAt)?.toISOString() ?? null, accessPolicy: row.accessPolicy })),
    invitations: invitations.map(row => ({ ...invitationView(row), covered: gifts.covered.includes(row.id) })), availableGifts: gifts.available };
}
export async function revokeComparisonInvitation(id: string, visitorId: string) {
  uuid.parse(id);
  return db().transaction(async tx => {
    const key = await tx.query.comparisonInvitations.findFirst({ where: and(eq(I.id, id), eq(I.visitorId, visitorId)), columns: { shareId: true } });
    if (!key) throw new ShareError(404, "NOT_FOUND");
    await lockShare(tx, key.shareId);
    const invitation = await lockInvitation(tx, id);
    if (invitation.visitorId !== visitorId) throw new ShareError(404, "NOT_FOUND");
    const at = new Date();
    await tx.update(I).set({ revokedAt: at }).where(and(eq(I.id, id), isNull(I.revokedAt)));
    await tx.update(P).set({ revokedAt: at, revokedBy: visitorId }).where(and(eq(P.invitationId, id), isNull(P.revokedAt)));
  });
}
export async function revokeComparison(id: string, visitorId: string) {
  uuid.parse(id);
  return db().transaction(async tx => {
    const [key] = await tx.select({ invitationId: I.id, shareId: I.shareId }).from(P).innerJoin(I, eq(P.invitationId, I.id))
      .where(and(eq(P.id, id), or(eq(P.hostVisitorId, visitorId), eq(P.guestVisitorId, visitorId)))).limit(1);
    if (!key) throw new ShareError(404, "NOT_FOUND");
    await lockShare(tx, key.shareId);
    await lockInvitation(tx, key.invitationId);
    const [pair] = await tx.select().from(P).where(eq(P.id, id)).for("update");
    if (!pair || (pair.hostVisitorId !== visitorId && pair.guestVisitorId !== visitorId)) throw new ShareError(404, "NOT_FOUND");
    await tx.update(P).set({ revokedAt: new Date(), revokedBy: visitorId }).where(and(eq(P.id, id), isNull(P.revokedAt)));
  });
}
