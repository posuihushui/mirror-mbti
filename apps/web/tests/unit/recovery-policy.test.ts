import { describe, expect, it } from "vitest";
import { isRecoverySameOrigin, readRecoveryBody, recoveryBucketKey, recoveryOrderId, RECOVERY_BODY_MAX_BYTES } from "@/lib/recovery-policy";

const orderId = "M2026091000000000DEADBEEF";
const url = "https://mirror.example/api/reports/recover";

describe("recovery credentials", () => {
  it("normalizes pasted order numbers while requiring the complete identifier", () => {
    expect(recoveryOrderId({ orderId: `  ${orderId.toLowerCase()}\n` })).toBe(orderId);
    for (const body of [null, {}, { orderId: 42 }, { orderId: orderId.slice(-16) }, { visitorId: "arbitrary-visitor" }]) {
      expect(recoveryOrderId(body)).toBeNull();
    }
  });

  it("requires the configured origin even when the request URL claims another host", () => {
    expect(isRecoverySameOrigin(new Request(url, { headers: { origin: "https://mirror.example" } }), url)).toBe(true);
    const untrustedHeaders: (HeadersInit | undefined)[] = [undefined, { origin: "null" }, { origin: "https://attacker.example" }, { origin: "https://mirror.example.attacker.example" }, { origin: "https://mirror.example", "sec-fetch-site": "cross-site" }];
    for (const headers of untrustedHeaders) {
      expect(isRecoverySameOrigin(new Request("https://attacker.example/api/reports/recover", { headers }), url)).toBe(false);
    }
  });

  it("does not depend on Content-Length to reject oversized JSON bodies", async () => {
    const request = (body: string) => new Request(url, { method: "POST", body });
    expect(await readRecoveryBody(request(JSON.stringify({ orderId })))).toEqual({ orderId });
    expect(await readRecoveryBody(request("{"))).toBeNull();
    expect(await readRecoveryBody(request(JSON.stringify({ orderId, padding: "x".repeat(RECOVERY_BODY_MAX_BYTES) })))).toBeNull();
  });
});

describe("recovery throttle identity", () => {
  const secret = "recovery-rate-limit-secret";
  const key = (ip: string) => recoveryBucketKey(new Request(url, { headers: { "x-forwarded-for": ip } }), secret);

  it("hashes an IP with a secret and ignores forged preceding proxy entries", () => {
    const expected = key("192.0.2.17");
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
    expect(key("198.51.100.20, 192.0.2.17")).toBe(expected);
    expect(key("192.0.2.18")).not.toBe(expected);
    expect(recoveryBucketKey(new Request(url, { headers: { "x-forwarded-for": "192.0.2.17" } }), "different-secret")).not.toBe(expected);
  });

  it("canonicalizes IPv6 and groups missing or malformed addresses", () => {
    expect(key("2001:db8::1")).toBe(key("2001:0db8:0:0:0:0:0:1"));
    expect(key("garbage")).toBe(recoveryBucketKey(new Request(url), secret));
  });
});
