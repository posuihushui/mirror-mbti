import { describe, expect, it } from "vitest";
import { comparisonInputSchema, invitationInputSchema, isKnownPreview, isShareSameOrigin, rateBucket, readShareBody, shareEventSchema, shareInputSchema, shareIpBucket, shareRequestHash, shareTokenSchema } from "@/lib/share-policy";

const requestId = "12345678-1234-4234-9234-123456789abc";
const token = "aB0_".repeat(8);
const input = { resultId: "abcDEF123_-4", selectedIds: ["share-v1:EI:I", "share-v1:SN:N", "share-v1:TF:F"], showType: false, showDimensions: false, consentVersion: "share-public-v1" as const, requestId };
const json = (body: string, headers: Record<string, string> = {}) => new Request("https://mirror.example/api/shares", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("share input privacy boundaries", () => {
  it("accepts exactly three unique selections and explicit consent", () => {
    expect(shareInputSchema.parse(input)).toEqual(input);
    for (const selectedIds of [[], input.selectedIds.slice(0, 2), [...input.selectedIds, "share-v1:JP:J"], Array(3).fill(input.selectedIds[0])]) {
      expect(shareInputSchema.safeParse({ ...input, selectedIds }).success).toBe(false);
    }
    for (const resultId of ["sample", "", "../result/id"]) expect(shareInputSchema.safeParse({ ...input, resultId }).success).toBe(false);
    expect(shareInputSchema.safeParse({ ...input, consentVersion: "compare-host-v1" }).success).toBe(false);
  });
  it("rejects client-supplied authorisation and private snapshots instead of silently ignoring them", () => {
    for (const extra of [{ profile: { type: "INFJ" } }, { visitorId: requestId }, { snapshot: { typeLabel: "INFJ" } }, { orderId: "bearer" }, { public: true }]) {
      expect(shareInputSchema.safeParse({ ...input, ...extra }).success).toBe(false);
    }
  });
  it("requires a distinct consent contract for both comparison parties", () => {
    expect(invitationInputSchema.safeParse({ shareId: requestId, requestId, consentVersion: "compare-host-v1" }).success).toBe(true);
    expect(invitationInputSchema.safeParse({ shareId: requestId, requestId, consentVersion: input.consentVersion }).success).toBe(false);
    expect(comparisonInputSchema.safeParse({ invitationToken: token, resultId: input.resultId, consentVersion: "compare-guest-v1" }).success).toBe(true);
    expect(comparisonInputSchema.safeParse({ invitationToken: token, resultId: input.resultId, consentVersion: "compare-host-v1" }).success).toBe(false);
  });
  it("accepts only 32 base64url token characters", () => {
    expect(shareTokenSchema.safeParse(token).success).toBe(true);
    for (const invalid of [token.slice(1), token + "A", token.slice(1) + "/", token.slice(1) + "+", "../" + token]) expect(shareTokenSchema.safeParse(invalid).success).toBe(false);
  });
  it("hashes semantic scope independently of selection order and retry request ID", () => {
    const hash = shareRequestHash(input);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(shareRequestHash({ ...input, selectedIds: [...input.selectedIds].reverse(), requestId: "87654321-1234-4234-9234-123456789abc" })).toBe(hash);
    for (const change of [{ showType: true }, { showDimensions: true }, { resultId: "xyzDEF123_-4" }, { selectedIds: [...input.selectedIds.slice(0, 2), "share-v1:JP:J"] }]) expect(shareRequestHash({ ...input, ...change })).not.toBe(hash);
  });
});

describe("share request safety", () => {
  it("requires canonical same origin even when request host is forged", () => {
    const request = (headers: Record<string, string>) => new Request("https://attacker.example/api/shares", { headers });
    expect(isShareSameOrigin(request({ origin: "https://mirror.example" }), "https://mirror.example")).toBe(true);
    for (const headers of ([{}, { origin: "https://attacker.example" }, { origin: "null" }, { origin: "https://mirror.example", "sec-fetch-site": "cross-site" }] as Record<string, string>[])) expect(isShareSameOrigin(request(headers), "https://mirror.example")).toBe(false);
  });
  it("bounds actual UTF-8 request bytes without relying on content-length", async () => {
    expect(await readShareBody(json('{"x":"中"}'), 11)).toEqual({ x: "中" });
    await expect(readShareBody(json('{"x":"中"}', { "content-length": "1" }), 10)).rejects.toMatchObject({ status: 413 });
    await expect(readShareBody(json("broken"))).rejects.toMatchObject({ status: 400 });
    await expect(readShareBody(json("{}", { "content-type": "text/plain" }))).rejects.toMatchObject({ status: 400 });
  });
  it("uses keyed, namespace-specific buckets and the trusted last proxy IP", () => {
    expect(rateBucket("create", requestId, "test-key")).toMatch(/^[a-f0-9]{64}$/);
    expect(rateBucket("create", requestId, "test-key")).not.toBe(rateBucket("image", requestId, "test-key"));
    expect(rateBucket("create", requestId, "test-key")).not.toBe(rateBucket("create", requestId, "another-key"));
    const req = (forwarded: string) => new Request("https://mirror.example", { headers: { "x-forwarded-for": forwarded } });
    expect(shareIpBucket(req("203.0.113.1, 127.0.0.1"), "test-key")).toBe(shareIpBucket(req("198.51.100.2, 127.0.0.1"), "test-key"));
  });
  it("excludes known preview and prefetch traffic", () => {
    for (const headers of ([{ "user-agent": "facebookexternalhit/1.1" }, { "user-agent": "Googlebot" }, { purpose: "prefetch" }, { "sec-purpose": "prefetch;prerender" }] as Record<string, string>[])) expect(isKnownPreview(new Request("https://mirror.example", { headers }))).toBe(true);
    expect(isKnownPreview(new Request("https://mirror.example", { headers: { "user-agent": "Mozilla/5.0 MicroMessenger" } }))).toBe(false);
  });
  it("accepts bounded operation events, rejects real-share-success and private extras", () => {
    const event = { eventId: requestId, surface: "share_page", eventName: "share_browser_visible", shareToken: token };
    expect(shareEventSchema.parse(event)).toMatchObject({ channel: "unknown" });
    for (const extra of [{ eventName: "share_success" }, { profile: "INFJ" }, { resultId: input.resultId }, { url: `https://mirror.example/s/${token}` }]) expect(shareEventSchema.safeParse({ ...event, ...extra }).success).toBe(false);
    expect(shareEventSchema.safeParse({ eventId: requestId, surface: "quiz", eventName: "share_quiz_started" }).success).toBe(true);
    expect(shareEventSchema.safeParse({ ...event, eventName: "share_quiz_started" }).success).toBe(false);
  });
});
