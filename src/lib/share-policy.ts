import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { recoveryBucketKey, isRecoverySameOrigin } from "@/lib/recovery-policy";

export const SHARE_CONSENT = "share-public-v1";
export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);
export const shareInputSchema = z.object({
  resultId: z.string().regex(/^[A-Za-z0-9_-]{12}$/),
  selectedIds: z.array(z.string().min(1).max(60)).length(3).refine((ids) => new Set(ids).size === 3),
  showType: z.boolean(), showDimensions: z.boolean(),
  consentVersion: z.literal(SHARE_CONSENT), requestId: z.uuid(),
}).strict();
export type ShareInput = z.infer<typeof shareInputSchema>;
export const invitationInputSchema = z.object({ shareId: z.uuid(), consentVersion: z.literal("compare-host-v1"), requestId: z.uuid() }).strict();
export const comparisonInputSchema = z.object({ invitationToken: shareTokenSchema, resultId: z.string().regex(/^[A-Za-z0-9_-]{12}$/), consentVersion: z.literal("compare-guest-v1") }).strict();
const eventBase = { eventId: z.uuid(), surface: z.enum(["result", "quiz", "share_page", "my_shares", "invitation", "pair"]), channel: z.enum(["link", "image", "unknown"]).default("unknown") };
export const shareEventSchema = z.discriminatedUnion("eventName", [
  z.object({ ...eventBase, eventName: z.literal("share_browser_visible"), shareToken: shareTokenSchema }).strict(),
  z.object({ ...eventBase, eventName: z.literal("share_image_requested"), shareToken: shareTokenSchema }).strict(),
  z.object({ ...eventBase, eventName: z.literal("share_link_copied"), shareToken: shareTokenSchema }).strict(),
  z.object({ ...eventBase, eventName: z.literal("share_quiz_started") }).strict(),
  z.object({ ...eventBase, eventName: z.literal("comparison_viewed"), pairId: z.uuid() }).strict(),
]);
export type ShareEvent = z.infer<typeof shareEventSchema>;
export class ShareError extends Error {
  constructor(public status: number, public code: string, public retryAfter?: number) { super(code); }
}
export function shareRequestHash(input: ShareInput) {
  return createHash("sha256").update(JSON.stringify({ resultId: input.resultId, selectedIds: [...input.selectedIds].sort(), showType: input.showType, showDimensions: input.showDimensions, consentVersion: input.consentVersion })).digest("hex");
}
export function rateBucket(namespace: string, identifier: string, secret: string) {
  return createHmac("sha256", secret).update(`sharing:${namespace}:${identifier}`).digest("hex");
}
export function shareIpBucket(request: Request, secret: string) { return rateBucket("image", recoveryBucketKey(request, secret), secret); }
export const isShareSameOrigin = isRecoverySameOrigin;
export function isKnownPreview(request: Request) {
  return /bot|crawler|spider|facebookexternalhit|preview|slack|telegram/i.test(request.headers.get("user-agent") ?? "")
    || /prefetch/i.test(`${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`);
}
export async function readShareBody(request: Request, maxBytes = 8192): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new ShareError(400, "INVALID_SHARE_INPUT");
  if (!request.body) throw new ShareError(400, "INVALID_SHARE_INPUT");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new ShareError(413, "INVALID_SHARE_INPUT"); } chunks.push(value); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) { if (error instanceof ShareError) throw error; throw new ShareError(400, "INVALID_SHARE_INPUT"); }
  finally { reader.releaseLock(); }
}
