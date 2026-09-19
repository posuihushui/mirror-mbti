import { describe, expect, it } from "vitest";
import { pageInfo, sanitizeLocation, sanitizeReferrer } from "@/lib/analytics/url";

const origin = "https://mirror.example";
const token = "aB0_".repeat(8);
const resultId = "abcDEF123_-4";
const pairId = "12345678-1234-4234-9234-123456789abc";

describe("share capability URL redaction before analytics", () => {
  for (const prefix of ["", "/en", "/zh"]) {
    const publicPrefix = prefix === "/zh" ? "" : prefix;
    for (const [route, redacted, pageType] of [
      [`/s/${token}`, "/s/[token]", "share"],
      [`/s/${token}/image`, "/s/[token]/image", "share"],
      [`/s/${token}/opengraph-image`, "/s/[token]", "share"],
      [`/t/${token}`, "/t/[token]", "invitation"],
      [`/t/${token}/join`, "/t/[token]/join", "invitation"],
      [`/compare/${pairId}`, "/compare/[id]", "comparison"],
      ["/my/shares", "/my/shares", "my_shares"],
      ["/my/pairing", "/my/pairing", "my_pairing"],
    ]) {
      it(`redacts ${prefix}${redacted} including private query/referrer/fragment values`, () => {
        const path = `${prefix}${route}`;
        const safePath = `${publicPrefix}${redacted}`;
        expect(pageInfo(path)).toEqual({ locale: prefix === "/en" ? "en" : "zh", pageType, path: safePath });
        const location = `${origin}${path}?result=${resultId}&compare=${token}&continuation=${pairId}&utm_content=${token}&from=${pairId}#${resultId}`;
        expect(sanitizeLocation(location)).toBe(origin + safePath);
        expect(sanitizeReferrer(location, origin)).toBe(origin + safePath);
      });
    }
  }
  it("drops invitation and result query context from ordinary questionnaire URLs", () => {
    expect(sanitizeLocation(`${origin}/en/quiz?compare=${token}&result=${resultId}`)).toBe(`${origin}/en/quiz`);
    expect(sanitizeLocation(`${origin}/result/${resultId}?compare=${token}`)).toBe(`${origin}/result/[id]`);
    expect(sanitizeLocation(`${origin}/en/pay/M2026091000000000DEADBEEF?continuation=${pairId}&compare=${token}`)).toBe(`${origin}/en/pay/[orderId]`);
    expect(pageInfo("/en/pairing")).toEqual({ locale: "en", pageType: "pairing", path: "/en/pairing" });
  });
});
