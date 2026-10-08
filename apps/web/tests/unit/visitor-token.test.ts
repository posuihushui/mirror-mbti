import { describe, expect, it } from "vitest";
import { issueVisitorToken, signVisitorToken, verifyVisitorToken } from "@/lib/visitor-token";

describe("visitor token", () => {
  const secret = "test-secret-with-enough-length";

  it("round-trips a signed id", () => {
    const { id, token } = issueVisitorToken(secret);
    expect(verifyVisitorToken(token, secret)).toBe(id);
  });

  it("can reissue the established owner without creating a new identity", () => {
    const { id } = issueVisitorToken(secret);
    const token = signVisitorToken(id, secret);
    expect(verifyVisitorToken(token, secret)).toBe(id);
    expect(verifyVisitorToken(token, "wrong-recovery-secret")).toBeNull();
    expect(() => signVisitorToken("not-a-visitor", secret)).toThrow("Invalid visitor id");
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
