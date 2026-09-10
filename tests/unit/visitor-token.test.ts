import { describe, expect, it } from "vitest";
import { issueVisitorToken, verifyVisitorToken } from "@/lib/visitor-token";

describe("visitor token", () => {
  const secret = "test-secret-with-enough-length";

  it("round-trips a signed id", () => {
    const { id, token } = issueVisitorToken(secret);
    expect(verifyVisitorToken(token, secret)).toBe(id);
  });

  it("rejects tampering, wrong secrets and malformed values", () => {
    const { id, token } = issueVisitorToken(secret);
    expect(verifyVisitorToken(token, "other-secret-value-here")).toBeNull();
    expect(verifyVisitorToken(`${id}.AAAA`, secret)).toBeNull();
    expect(verifyVisitorToken(token.replace(id[0], id[0] === "a" ? "b" : "a"), secret)).toBeNull();
    expect(verifyVisitorToken(undefined, secret)).toBeNull();
    expect(verifyVisitorToken("no-dot", secret)).toBeNull();
    expect(verifyVisitorToken("not-a-uuid.sig", secret)).toBeNull();
  });
});
