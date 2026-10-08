import { afterEach, describe, expect, it, vi } from "vitest";
import { emitPairingEvent, emitPairingResume } from "@/lib/pairing-tracking";
import { shareEventSchema } from "@/lib/share-policy";

const resultId = "abcdefgh1234";
const continuationId = "8d6a32b1-86be-439a-a72d-62b85d7d9a00";
afterEach(() => vi.unstubAllGlobals());

describe("first-party pairing tracking", () => {
  it("sends only the owner result reference to our API, with localized minimal payload", () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    const gtag = vi.fn();
    vi.stubGlobal("window", { location: new URL("https://mirror.example/en/result/abcdefgh1234?compare=private"), gtag });
    vi.stubGlobal("fetch", fetch);
    emitPairingEvent("pairing_checkout_opened", resultId, "payment_sheet");
    expect(fetch).toHaveBeenCalledOnce();
    const [target, options] = fetch.mock.calls[0];
    expect(target).toBe("/api/share-events");
    expect(options).toMatchObject({ method: "POST", cache: "no-store", keepalive: true, headers: { "X-Mirror-Locale": "en" } });
    expect(shareEventSchema.parse(JSON.parse(options.body))).toEqual({
      eventId: expect.any(String), eventName: "pairing_checkout_opened", resultId, surface: "payment_sheet", channel: "unknown",
    });
    expect(options.body).not.toMatch(/private|eligible|answers|score|order/);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends only continuation ID for resume so the server resolves the owner and invitation", () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("window", { location: new URL("https://mirror.example/pay/private") });
    vi.stubGlobal("fetch", fetch);
    emitPairingResume(continuationId, "pay_status");
    expect(shareEventSchema.parse(JSON.parse(fetch.mock.calls[0][1].body))).toEqual({
      eventId: expect.any(String), eventName: "pairing_resume_clicked", continuationId, surface: "pay_status", channel: "unknown",
    });
  });

  it("never throws on unavailable crypto, rejected requests, or server rendering", async () => {
    vi.stubGlobal("window", { location: new URL("https://mirror.example/result/abcdefgh1234") });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(() => emitPairingEvent("pairing_entry_clicked", resultId, "result")).not.toThrow();
    await Promise.resolve();
    vi.stubGlobal("crypto", { randomUUID: () => { throw new Error("unavailable"); } });
    expect(() => emitPairingResume(continuationId, "pay_status")).not.toThrow();
    vi.stubGlobal("window", undefined);
    expect(() => emitPairingEvent("pairing_benefit_viewed", resultId, "result")).not.toThrow();
  });

  it("rejects injected entitlement and server-only selection events", () => {
    const event = { eventId: continuationId, eventName: "pairing_benefit_viewed", resultId, surface: "result", channel: "unknown" };
    expect(shareEventSchema.safeParse({ ...event, eligibilityAtEvent: "eligible" }).success).toBe(false);
    expect(shareEventSchema.safeParse({ ...event, eventName: "pairing_result_selected" }).success).toBe(false);
  });
});
