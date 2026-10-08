import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { and, count, desc, eq, isNull, lt, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { appUrl } from "@/lib/env";
import { href, type Locale } from "@/lib/i18n/locale";
import { questionnaireLocale } from "@/lib/questionnaires";
import { buildPublicShareSnapshot, buildShareCandidates, defaultShareSelection } from "@/lib/share-content";
import { ShareError, shareRequestHash, shareTokenSchema, type ShareInput } from "@/lib/share-policy";
import { lockVisitor } from "@/lib/share-request";

export type ShareRow = typeof schema.resultShares.$inferSelect;
export function ownedShareView(row: ShareRow) {
  const url = `${appUrl()}${href(row.locale as Locale, `/s/${row.token}`)}`;
  return { id: row.id, resultId: row.resultId, token: row.token, url, imageUrl: `${url}/image`, snapshot: row.snapshot, createdAt: row.createdAt.toISOString(), revokedAt: row.revokedAt?.toISOString() ?? null };
}
export async function shareOptions(resultId: string, visitorId: string) {
  const row = await db().query.results.findFirst({ where: and(eq(schema.results.id, resultId), eq(schema.results.visitorId, visitorId)), columns: { type: true, values: true, balanced: true, questionnaireId: true } });
  if (!row) throw new ShareError(404, "NOT_FOUND");
  const locale = questionnaireLocale(row.questionnaireId);
  // The result id fixes this card's wording, so preview and published card always agree.
  const candidates = buildShareCandidates(row, locale, resultId);
  const defaultSelectedIds = defaultShareSelection(row);
  const preview = buildPublicShareSnapshot(row, locale, defaultSelectedIds, true, true, resultId);
  const recent = await db().query.resultShares.findMany({ where: and(eq(schema.resultShares.visitorId, visitorId), eq(schema.resultShares.resultId, resultId)), orderBy: [desc(schema.resultShares.createdAt), desc(schema.resultShares.id)], limit: 5 });
  return { locale, candidates, defaultSelectedIds, typeLabel: preview.typeLabel, typeNote: preview.typeNote, dimensions: preview.dimensions,
    snapshotBase: buildPublicShareSnapshot(row, locale, defaultSelectedIds, false, false, resultId), recentShares: recent.map(ownedShareView) };
}
export async function createShare(visitorId: string, input: ShareInput) {
  return db().transaction(async (tx) => {
    await lockVisitor(tx, visitorId);
    const hash = shareRequestHash(input);
    const existing = await tx.query.resultShares.findFirst({ where: and(eq(schema.resultShares.visitorId, visitorId), eq(schema.resultShares.requestId, input.requestId)) });
    if (existing) {
      if (existing.requestHash !== hash) throw new ShareError(409, "IDEMPOTENCY_CONFLICT");
      if (existing.revokedAt) throw new ShareError(410, "SHARE_CLOSED");
      return { created: false, item: ownedShareView(existing) };
    }
    const row = await tx.query.results.findFirst({ where: and(eq(schema.results.id, input.resultId), eq(schema.results.visitorId, visitorId)), columns: { type: true, values: true, balanced: true, questionnaireId: true } });
    if (!row) throw new ShareError(404, "NOT_FOUND");
    const locale = questionnaireLocale(row.questionnaireId);
    const allowed = new Set(buildShareCandidates(row, locale, input.resultId).map((candidate) => candidate.id));
    if (input.selectedIds.some((id) => !allowed.has(id))) throw new ShareError(400, "INVALID_SHARE_INPUT");
    const snapshot = buildPublicShareSnapshot(row, locale, input.selectedIds, input.showType, input.showDimensions, input.resultId);
    const [saved] = await tx.insert(schema.resultShares).values({ id: randomUUID(), token: randomBytes(24).toString("base64url"), visitorId, resultId: input.resultId,
      requestId: input.requestId, requestHash: hash, locale, contentVersion: "share-v1", snapshot, selectedIds: input.selectedIds,
      showType: input.showType, showDimensions: input.showDimensions, consentVersion: input.consentVersion }).returning();
    return { created: true, item: ownedShareView(saved) };
  });
}
export async function getPublicShare(token: string) {
  if (!shareTokenSchema.safeParse(token).success) return null;
  const [row] = await db().select({ snapshot: schema.resultShares.snapshot, locale: schema.resultShares.locale }).from(schema.resultShares)
    .where(and(eq(schema.resultShares.token, token), isNull(schema.resultShares.revokedAt))).limit(1);
  return row ? { snapshot: row.snapshot, locale: row.locale as Locale } : null;
}
/** The visitor's shares made in `locale`: a card's text and link are in the language its result was taken in. */
export async function listOwnedShares(visitorId: string, locale: Locale, cursor?: string | null) {
  let before: { at: string; id: string } | null = null;
  if (cursor) {
    try { before = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")); } catch { throw new ShareError(400, "INVALID_SHARE_INPUT"); }
    if (!before || !Number.isFinite(Date.parse(before.at)) || !/^[0-9a-f-]{36}$/.test(before.id)) throw new ShareError(400, "INVALID_SHARE_INPUT");
  }
  const t = schema.resultShares;
  const rows = await db().query.resultShares.findMany({ where: and(eq(t.visitorId, visitorId), eq(t.locale, locale), before ? or(lt(t.createdAt, new Date(before.at)), and(eq(t.createdAt, new Date(before.at)), lt(t.id, before.id))) : undefined), orderBy: [desc(t.createdAt), desc(t.id)], limit: 21 });
  const items = rows.slice(0, 20); const last = items.at(-1);
  return { items: items.map(ownedShareView), nextCursor: rows.length > 20 && last ? Buffer.from(JSON.stringify({ at: last.createdAt.toISOString(), id: last.id })).toString("base64url") : null };
}
/** How many of the visitor's shares were made in another language than `locale`. */
export async function countSharesElsewhere(visitorId: string, locale: Locale) {
  const t = schema.resultShares;
  const [row] = await db().select({ n: count() }).from(t).where(and(eq(t.visitorId, visitorId), ne(t.locale, locale)));
  return row?.n ?? 0;
}
export async function revokeShare(id: string, visitorId: string) {
  await db().transaction(async (tx) => {
    const [share] = await tx.select({ id: schema.resultShares.id }).from(schema.resultShares).where(and(eq(schema.resultShares.id, id), eq(schema.resultShares.visitorId, visitorId))).for("update");
    if (!share) throw new ShareError(404, "NOT_FOUND");
    const at = new Date();
    await tx.update(schema.resultShares).set({ revokedAt: at }).where(and(eq(schema.resultShares.id, id), isNull(schema.resultShares.revokedAt)));
    const invitations = await tx.select({ id: schema.comparisonInvitations.id }).from(schema.comparisonInvitations).where(eq(schema.comparisonInvitations.shareId, id)).for("update");
    for (const invitation of invitations) {
      await tx.update(schema.comparisonInvitations).set({ revokedAt: at }).where(and(eq(schema.comparisonInvitations.id, invitation.id), isNull(schema.comparisonInvitations.revokedAt)));
      await tx.update(schema.comparisons).set({ revokedAt: at, revokedBy: visitorId }).where(and(eq(schema.comparisons.invitationId, invitation.id), isNull(schema.comparisons.revokedAt)));
    }
  });
}
