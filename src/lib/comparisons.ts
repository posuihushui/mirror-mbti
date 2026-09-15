import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { appUrl } from "@/lib/env";
import { href, type Locale } from "@/lib/i18n/locale";
import { getQuestionnaire, questionnaireLocale } from "@/lib/questionnaires";
import { generateCompareContent } from "@/lib/compare-content";
import { COMPARE_CONTENT_VERSION, type CompareSnapshot } from "@/lib/compare-types";
import { ShareError, invitationInputSchema, comparisonInputSchema, shareTokenSchema } from "@/lib/share-policy";

type Invitation = typeof schema.comparisonInvitations.$inferSelect;
type Pair = typeof schema.comparisons.$inferSelect;
type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
const I = schema.comparisonInvitations, P = schema.comparisons, S = schema.resultShares, R = schema.results;
const uuid = z.uuid();
const resultIdFormat = /^[A-Za-z0-9_-]{12}$/;
const resultColumns = { id: true, type: true, balanced: true, questionnaireId: true, createdAt: true } as const;

function snapshotFromResult(row: Pick<typeof R.$inferSelect, "type" | "balanced" | "questionnaireId" | "createdAt">): CompareSnapshot {
  const questionnaire = getQuestionnaire(row.questionnaireId);
  if (!questionnaire || !/^[EI][SN][TF][JP]$/.test(row.type) || row.balanced.length !== 4) throw new ShareError(503, "SHARE_UNAVAILABLE");
  return {
    categories: {
      EI: row.balanced[0] ? "balanced" : row.type[0] as "E" | "I",
      SN: row.balanced[1] ? "balanced" : row.type[1] as "S" | "N",
      TF: row.balanced[2] ? "balanced" : row.type[2] as "T" | "F",
      JP: row.balanced[3] ? "balanced" : row.type[3] as "J" | "P",
    },
    questionnaireId: questionnaire.id, createdAt: row.createdAt.toISOString(),
  };
}
function invitationView(row: Invitation) {
  return { id: row.id, token: row.token, url: `${appUrl()}${href(row.locale as Locale, `/t/${row.token}`)}`, locale: row.locale as Locale,
    snapshot: row.publicSnapshot, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt.toISOString(), revokedAt: row.revokedAt?.toISOString() ?? null };
}
function pairView(row: Pair, visitorId: string) {
  return { id: row.id, url: href(row.locale as Locale, `/compare/${row.id}`), locale: row.locale as Locale,
    hostSnapshot: row.hostSnapshot, guestSnapshot: row.guestSnapshot, outputSnapshot: row.outputSnapshot,
    role: row.hostVisitorId === visitorId ? "host" as const : "guest" as const, createdAt: row.createdAt.toISOString() };
}
async function lockShare(tx: Tx, shareId: string) {
  const [share] = await tx.select().from(S).where(eq(S.id, shareId)).for("update");
  if (!share) throw new ShareError(404, "NOT_FOUND");
  return share;
}
async function lockInvitation(tx: Tx, invitationId: string) {
  const [invitation] = await tx.select().from(I).where(eq(I.id, invitationId)).for("update");
  if (!invitation) throw new ShareError(404, "NOT_FOUND");
  return invitation;
}
export async function invitationOptions(shareId: string, visitorId: string) {
  if (!uuid.safeParse(shareId).success) throw new ShareError(404, "NOT_FOUND");
  const share = await db().query.resultShares.findFirst({ where: and(eq(S.id, shareId), eq(S.visitorId, visitorId), isNull(S.revokedAt)), columns: { resultId: true } });
  if (!share) throw new ShareError(404, "NOT_FOUND");
  const result = await getComparisonResult(share.resultId, visitorId);
  if (!result) throw new ShareError(404, "NOT_FOUND");
  return { locale: questionnaireLocale(result.snapshot.questionnaireId), snapshot: result.snapshot };
}
export async function getComparisonResult(resultId: string, visitorId: string) {
  if (!resultIdFormat.test(resultId)) return null;
  const row = await db().query.results.findFirst({ where: and(eq(R.id, resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
  return row ? { id: row.id, snapshot: snapshotFromResult(row) } : null;
}
export async function listComparisonResults(visitorId: string) {
  const rows = await db().query.results.findMany({ where: eq(R.visitorId, visitorId), columns: resultColumns, orderBy: [desc(R.createdAt), desc(R.id)], limit: 100 });
  return rows.map(row => ({ id: row.id, snapshot: snapshotFromResult(row) }));
}
export async function createComparisonInvitation(visitorId: string, raw: z.infer<typeof invitationInputSchema>) {
  const input = invitationInputSchema.parse(raw);
  const hash = createHash("sha256").update(JSON.stringify({ shareId: input.shareId, consentVersion: input.consentVersion })).digest("hex");
  return db().transaction(async tx => {
    // Serialize this owner’s request keys across shares without acquiring visitor row locks.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`comparison-invitation:${visitorId}`}, 0))`);
    const share = await lockShare(tx, input.shareId);
    if (share.visitorId !== visitorId) throw new ShareError(404, "NOT_FOUND");
    if (share.revokedAt) throw new ShareError(410, "SHARE_CLOSED");
    const old = await tx.query.comparisonInvitations.findFirst({ where: and(eq(I.visitorId, visitorId), eq(I.requestId, input.requestId)) });
    if (old) {
      if (old.requestHash !== hash) throw new ShareError(409, "IDEMPOTENCY_CONFLICT");
      if (old.revokedAt || old.expiresAt <= new Date()) throw new ShareError(410, "INVITATION_UNAVAILABLE");
      return { created: false, item: invitationView(old) };
    }
    // Parent row serializes expiry and active-invitation checks for this share.
    const active = await tx.query.comparisonInvitations.findFirst({ where: and(eq(I.shareId, share.id), isNull(I.revokedAt), gt(I.expiresAt, new Date())) });
    if (active) throw new ShareError(409, "ACTIVE_INVITATION");
    const result = await tx.query.results.findFirst({ where: and(eq(R.id, share.resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    const now = new Date();
    const [row] = await tx.insert(I).values({ id: randomUUID(), token: randomBytes(24).toString("base64url"), shareId: share.id, visitorId,
      resultId: result.id, locale: questionnaireLocale(result.questionnaireId), publicSnapshot: snapshotFromResult(result), contentVersion: COMPARE_CONTENT_VERSION,
      consentVersion: input.consentVersion, requestId: input.requestId, requestHash: hash, createdAt: now, expiresAt: new Date(+now + 30 * 86400000) }).returning();
    return { created: true, item: invitationView(row) };
  });
}
export async function getPublicInvitation(token: string) {
  if (!shareTokenSchema.safeParse(token).success) return null;
  const [row] = await db().select({ locale: I.locale, snapshot: I.publicSnapshot, expiresAt: I.expiresAt, shareToken: S.token }).from(I).innerJoin(S, eq(S.id, I.shareId))
    .where(and(eq(I.token, token), isNull(I.revokedAt), isNull(S.revokedAt), gt(I.expiresAt, new Date()))).limit(1);
  return row ? { ...row, locale: row.locale as Locale, expiresAt: row.expiresAt.toISOString() } : null;
}
export async function joinComparison(visitorId: string, raw: z.infer<typeof comparisonInputSchema>) {
  const input = comparisonInputSchema.parse(raw);
  return db().transaction(async tx => {
    // Lookup supplies immutable lock keys only. Authorization is rechecked after locks.
    const key = await tx.query.comparisonInvitations.findFirst({ where: eq(I.token, input.invitationToken), columns: { id: true, shareId: true } });
    if (!key) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    const share = await lockShare(tx, key.shareId);
    const invitation = await lockInvitation(tx, key.id);
    if (share.revokedAt || invitation.revokedAt) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    if (invitation.visitorId === visitorId) throw new ShareError(409, "SELF_COMPARISON");
    const [existing] = await tx.select().from(P).where(and(eq(P.invitationId, invitation.id), eq(P.guestVisitorId, visitorId))).for("update");
    if (existing) {
      if (existing.revokedAt) throw new ShareError(410, "INVITATION_UNAVAILABLE");
      if (existing.guestResultId !== input.resultId) throw new ShareError(409, "ALREADY_JOINED");
      return { created: false, item: pairView(existing, visitorId) };
    }
    if (invitation.expiresAt <= new Date()) throw new ShareError(410, "INVITATION_UNAVAILABLE");
    const result = await tx.query.results.findFirst({ where: and(eq(R.id, input.resultId), eq(R.visitorId, visitorId)), columns: resultColumns });
    if (!result) throw new ShareError(404, "NOT_FOUND");
    const guestSnapshot = snapshotFromResult(result);
    const locale = invitation.locale as Locale;
    const [row] = await tx.insert(P).values({ id: randomUUID(), invitationId: invitation.id, hostVisitorId: invitation.visitorId,
      guestVisitorId: visitorId, guestResultId: result.id, hostSnapshot: invitation.publicSnapshot, guestSnapshot,
      contentVersion: COMPARE_CONTENT_VERSION, locale, outputSnapshot: generateCompareContent(invitation.publicSnapshot, guestSnapshot, locale),
      guestConsentVersion: input.consentVersion }).returning();
    return { created: true, item: pairView(row, visitorId) };
  });
}
export async function getOwnedComparison(id: string, visitorId: string) {
  if (!uuid.safeParse(id).success) return null;
  const [row] = await db().select({ pair: P }).from(P).innerJoin(I, eq(P.invitationId, I.id)).innerJoin(S, eq(I.shareId, S.id))
    .where(and(eq(P.id, id), or(eq(P.hostVisitorId, visitorId), eq(P.guestVisitorId, visitorId)), isNull(P.revokedAt), isNull(I.revokedAt), isNull(S.revokedAt))).limit(1);
  return row ? pairView(row.pair, visitorId) : null;
}
export async function listOwnedComparisons(visitorId: string) {
  const rows = await db().select({ pair: P }).from(P).innerJoin(I, eq(P.invitationId, I.id)).innerJoin(S, eq(I.shareId, S.id))
    .where(and(or(eq(P.hostVisitorId, visitorId), eq(P.guestVisitorId, visitorId)), isNull(P.revokedAt), isNull(I.revokedAt), isNull(S.revokedAt)))
    .orderBy(desc(P.createdAt), desc(P.id)).limit(100);
  const invitations = await db().select({ invitation: I }).from(I).innerJoin(S, eq(I.shareId, S.id))
    .where(and(eq(I.visitorId, visitorId), isNull(S.revokedAt))).orderBy(desc(I.createdAt), desc(I.id)).limit(100);
  return { items: rows.map(row => pairView(row.pair, visitorId)), invitations: invitations.map(row => invitationView(row.invitation)) };
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
