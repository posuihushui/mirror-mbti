import { describe, expect, it } from "vitest";
import { browserPath, referrerHost, browserDevice } from "@/lib/analytics/browser-policy";
describe("browser measurement privacy", () => {
  it("redacts all private paths, unknown paths, type values and query strings", () => {
    for (const prefix of ["", "/zh", "/en"]) {
      expect(browserPath(`${prefix}/result/private?token=secret`).path).not.toContain("private");
      expect(browserPath(`${prefix}/t/secret/join`).path).not.toContain("secret");
      expect(browserPath(`${prefix}/anything/private?secret=yes`).path).not.toContain("private");
      expect(browserPath(`${prefix}/types/INFJ`).path).not.toContain("INFJ");
    }
    expect(browserPath("/zh/quiz?utm_source=x").path).toBe("/zh/quiz");
  });
  it("keeps only a source hostname and a coarse device class", () => {
    expect(referrerHost("https://example.com/private?order=secret")).toBe("example.com");
    expect(referrerHost("javascript:secret")).toBeNull();
    expect(browserDevice("Android Mobile")).toBe("phone");
    expect(browserDevice("Android Tablet")).toBe("tablet");
    expect(browserDevice("Macintosh")).toBe("desktop");
  });
});
