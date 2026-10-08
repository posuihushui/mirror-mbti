import { describe, expect, it } from "vitest";
import { scryptSync } from "node:crypto";
import { issueAdminSession, validAdminSession, verifyCredentials, sameAdminOrigin, type AdminConfig, SESSION_SECONDS } from "../../src/lib/auth-policy";
const salt = "12345678901234567890123456789012";
const config: AdminConfig = { username: "admin", passwordHash: `scrypt:${salt}:${scryptSync("long-test-password", salt, 64).toString("hex")}`, secret: "a".repeat(32), origin: "http://localhost:3001" };
describe("admin access", () => {
  it("checks both username and the scrypt password", async () => {
    expect(await verifyCredentials("admin", "long-test-password", config)).toBe(true);
    expect(await verifyCredentials("other", "long-test-password", config)).toBe(false);
    expect(await verifyCredentials("admin", "wrong", config)).toBe(false);
  });
  it("rejects tampering, expiration, future forged lifetimes, and changed credentials", () => {
    const now = 1791450000000; const token = issueAdminSession(config, now);
    expect(validAdminSession(token, config, now)).toBe(true);
    expect(validAdminSession(token + "x", config, now)).toBe(false);
    expect(validAdminSession(token.replace(/^./, "0"), config, now)).toBe(false);
    expect(validAdminSession(token, config, now + SESSION_SECONDS * 1000)).toBe(false);
    expect(validAdminSession(token, config, now - 3600000)).toBe(false);
    expect(validAdminSession(token, { ...config, passwordHash: config.passwordHash + "1" }, now)).toBe(false);
    expect(validAdminSession(token, { ...config, secret: "b".repeat(32) }, now)).toBe(false);
  });
  it("requires the configured origin and rejects cross-site writes", () => {
    expect(sameAdminOrigin(new Request(config.origin, { headers: { origin: config.origin } }), config)).toBe(true);
    expect(sameAdminOrigin(new Request(config.origin, { headers: { origin: "https://evil.example" } }), config)).toBe(false);
    expect(sameAdminOrigin(new Request(config.origin), config)).toBe(false);
    expect(sameAdminOrigin(new Request(config.origin, { headers: { origin: config.origin, "sec-fetch-site": "cross-site" } }), config)).toBe(false);
  });
});
