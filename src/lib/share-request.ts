import "server-only";
import { connection, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { appUrl, sessionSecret } from "@/lib/env";
import { getVisitorId } from "@/lib/session";
import { requestLocale } from "@/lib/i18n/request";
import { ShareError, isShareSameOrigin, rateBucket } from "@/lib/share-policy";
import type { Locale } from "@/lib/i18n/locale";

export const shareNoStore = { "cache-control": "private, no-store", "referrer-policy": "no-referrer" };
const errors: Record<string, [string, string]> = {
  NO_SESSION: ["会话不可用，请刷新页面并允许Cookie后重试。", "Your session is unavailable. Allow cookies and reload."],
  INVALID_ORIGIN: ["请在本站页面操作。", "Please use the page on this site."],
  INVALID_SHARE_INPUT: ["请检查所选内容和公开选项。", "Please check your selection and sharing options."],
  NOT_FOUND: ["记录不存在或不可访问。", "This record is unavailable."],
  SHARE_CLOSED: ["这份分享已关闭。", "This share is closed."],
  IDEMPOTENCY_CONFLICT: ["内容已变化，请重新生成。", "The selection changed. Please create a new guide."],
  RATE_LIMITED: ["操作较频繁，请稍后再试。", "Too many requests. Please try again later."],
  SHARE_UNAVAILABLE: ["暂时无法完成，请稍后重试。", "This is temporarily unavailable. Please try again."],
  ACTIVE_INVITATION: ["这份结果在这种关系下已有有效邀请，请在我的双人指南中查看。", "This result already has an active invitation for this relationship. Open your guides for two to view it."],
  GIFT_NONE_AVAILABLE: ["没有可以使用的请 TA 名额。", "You have no unused cover."],
  ALREADY_JOINED: ["你已使用另一份结果参与这份邀请。", "You already joined this invitation with another result."],
  INVITATION_UNAVAILABLE: ["这份邀请已结束或关闭。", "This invitation has ended or is closed."],
  PAIRING_UNLOCK_REQUIRED: ["请先解锁这份结果的完整报告，再发起或加入双人指南。", "Unlock the full report for this result before starting or joining a guide for two."],
  PAIRING_ENTITLEMENT_SYNCING: ["付款已确认，正在核对报告权益，请勿重复购买。", "Payment is confirmed. Report access is being checked. Please do not purchase again."],
  CONSENT_REFRESH_REQUIRED: ["公开范围与使用规则已更新，请刷新后重新确认。", "The visibility and access terms have changed. Reload and confirm them again."],
  INVITATION_UPGRADE_REQUIRED: ["邀请方式已更新，请发起者重新创建邀请。", "The invitation process has changed. Ask the host to create a new invitation."],
  SELF_COMPARISON: ["请让另一位参与者打开邀请。", "Please let another person open this invitation."],
};
export function shareFailure(error: unknown, locale: Locale) {
  const e = error instanceof ShareError ? error : error instanceof z.ZodError ? new ShareError(400, "INVALID_SHARE_INPUT") : new ShareError(503, "SHARE_UNAVAILABLE");
  if (!(error instanceof ShareError) && !(error instanceof z.ZodError)) console.error("[sharing] request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ ok: false, error: { code: e.code, message: (errors[e.code] ?? errors.SHARE_UNAVAILABLE)[locale === "en" ? 1 : 0] } }, { status: e.status, headers: { ...shareNoStore, ...(e.retryAfter ? { "retry-after": String(e.retryAfter) } : {}) } });
}
export function shareOk<T>(data: T, status = 200) { return NextResponse.json({ ok: true, data }, { status, headers: shareNoStore }); }
export async function consumeShareRate(bucketKey: string, limit: number, seconds: number) {
  const t = schema.shareRateLimits;
  const expired = sql`${t.windowStartedAt} <= now() - (${seconds} * interval '1 second')`;
  const [bucket] = await db().insert(t).values({ bucketKey }).onConflictDoUpdate({ target: t.bucketKey, set: {
    attempts: sql`case when ${expired} then 1 else least(${t.attempts}+1, ${limit + 1}) end`,
    windowStartedAt: sql`case when ${expired} then now() else ${t.windowStartedAt} end`,
  } }).returning();
  if (bucket.attempts > limit) throw new ShareError(429, "RATE_LIMITED", Math.max(1, Math.ceil((bucket.windowStartedAt.getTime() + seconds * 1000 - Date.now()) / 1000)));
}
export async function shareRequest(request: Request, action: (visitorId: string) => Promise<Response>, options: { write?: boolean; limit?: number; window?: number; namespace?: string } = {}) {
  await connection();
  try {
    if (options.write && !isShareSameOrigin(request, appUrl())) throw new ShareError(403, "INVALID_ORIGIN");
    const visitorId = await getVisitorId(); if (!visitorId) throw new ShareError(401, "NO_SESSION");
    if (options.limit) await consumeShareRate(rateBucket(options.namespace ?? "write", visitorId, sessionSecret()), options.limit, options.window ?? 3600);
    return await action(visitorId);
  } catch (error) { return shareFailure(error, requestLocale(request)); }
}
export async function ensureShareVisitor(visitorId: string) {
  await db().insert(schema.visitors).values({ id: visitorId }).onConflictDoNothing({ target: schema.visitors.id });
}
export async function lockVisitor(tx: Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0], visitorId: string) {
  await tx.select({ id: schema.visitors.id }).from(schema.visitors).where(eq(schema.visitors.id, visitorId)).for("update");
}
