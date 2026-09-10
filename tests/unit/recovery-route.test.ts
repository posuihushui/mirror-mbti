import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reports/recover/route";
import { proxy } from "@/proxy";
import { verifyVisitorToken } from "@/lib/visitor-token";

const mocks = vi.hoisted(() => ({ attempt: vi.fn(), owner: vi.fn() }));
vi.mock("@/lib/recovery", () => ({ consumeRecoveryAttempt: mocks.attempt, visitorForRecoveryOrder: mocks.owner }));
vi.mock("@/lib/env", () => ({ appUrl: () => "https://mirror.example", sessionSecret: () => "test-recovery-session-secret" }));
vi.mock("next/server", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/server")>()), connection: vi.fn(async () => {}) }));

const url = "https://mirror.example/api/reports/recover";
const orderId = "M2026091000000000DEADBEEF";
const visitorId = "419432da-4c90-4c02-b445-ac94c35f414e";

function request(body: unknown = { orderId }, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers: { "content-type": "application/json", origin: "https://mirror.example", ...headers }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.attempt.mockResolvedValue({ allowed: true, retryAfter: 900 });
  mocks.owner.mockResolvedValue(visitorId);
});

describe("report recovery route", () => {
  it("sets the established owner cookie and returns no private account or order details", async () => {
    const response = await POST(request({ orderId: ` ${orderId.toLowerCase()} ` }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { recovered: true } });
    expect(mocks.owner).toHaveBeenCalledWith(orderId);
    expect(verifyVisitorToken(response.cookies.get("mid")?.value, "test-recovery-session-secret")).toBe(visitorId);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
  });

  it("gives the same safe response for a malformed or unknown order without changing the cookie", async () => {
    const malformed = await POST(request({ orderId: "DEADBEEF" }));
    expect(mocks.owner).not.toHaveBeenCalled();
    mocks.owner.mockResolvedValue(null);
    const unknown = await POST(request());
    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual(await malformed.json());
    expect(unknown.headers.has("set-cookie")).toBe(false);
    expect(unknown.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin recovery before looking up a credential", async () => {
    const response = await POST(request({ orderId }, { origin: "https://attacker.example" }));
    expect(response.status).toBe(403);
    expect(mocks.attempt).not.toHaveBeenCalled();
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("rejects missing Origin before touching storage", async () => {
    const response = await POST(new Request(url, { method: "POST", body: JSON.stringify({ orderId }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(403);
    expect(mocks.attempt).not.toHaveBeenCalled();
    expect(mocks.owner).not.toHaveBeenCalled();
  });

  it("enforces a persisted denial before performing an order lookup", async () => {
    mocks.attempt.mockResolvedValue({ allowed: false, retryAfter: 501 });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("501");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("fails closed when persistence is unavailable", async () => {
    mocks.attempt.mockRejectedValue(new Error("database unavailable"));
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await POST(request());
      expect(response.status).toBe(503);
      expect(mocks.owner).not.toHaveBeenCalled();
      expect(response.headers.has("set-cookie")).toBe(false);
    } finally {
      logging.mockRestore();
    }
  });

  it("does not let the proxy issue a competing cookie during recovery", () => {
    expect(proxy(new NextRequest(url, { method: "POST" })).headers.has("set-cookie")).toBe(false);
    expect(proxy(new NextRequest("https://mirror.example/quiz")).headers.has("set-cookie")).toBe(true);
  });
});
