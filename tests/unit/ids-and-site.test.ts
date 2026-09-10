import { describe, expect, it } from "vitest";
import { isValidOrderId, newOrderId, newResultId } from "@/lib/ids";
import { formatPriceFen } from "@/lib/site";
import { pickWeChatChannel } from "@/lib/ua";

describe("ids", () => {
  it("result ids are 12 url-safe chars", () => {
    for (let i = 0; i < 50; i++) expect(newResultId()).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });
  it("order ids fit WeChat out_trade_no rules and the API validator", () => {
    const id = newOrderId(new Date("2026-09-10T00:00:00Z"));
    expect(id).toMatch(/^M\d{8}[0-9A-F]{22}$/);
    expect(isValidOrderId(id)).toBe(true);
    expect(id.length).toBeLessThanOrEqual(32);
    expect(id.startsWith("M20260910")).toBe(true);
  });
  it("keeps existing order numbers usable and rejects partial identifiers", () => {
    expect(isValidOrderId("M2026091000000000DEADBEEF")).toBe(true);
    expect(isValidOrderId("M2026091000000000DEADBEEF123456")).toBe(true);
    for (const invalid of ["M20260910", "DEADBEEF", "M2026091000000000DEADBEEF1", "M2026091000000000DEADBEEF1234567", "M2026091000000000deadbeef"]) {
      expect(isValidOrderId(invalid)).toBe(false);
    }
  });
});

describe("formatPriceFen", () => {
  it("drops trailing zeros", () => {
    expect(formatPriceFen(690)).toBe("6.9");
    expect(formatPriceFen(700)).toBe("7");
    expect(formatPriceFen(1280)).toBe("12.8");
    expect(formatPriceFen(1299)).toBe("12.99");
  });
});

describe("pickWeChatChannel", () => {
  it("chooses jsapi in WeChat, h5 on mobile browsers, native elsewhere", () => {
    expect(pickWeChatChannel("Mozilla/5.0 (iPhone) MicroMessenger/8.0")).toBe("jsapi");
    expect(pickWeChatChannel("Mozilla/5.0 (Linux; Android 14) Mobile Safari")).toBe("h5");
    expect(pickWeChatChannel("Mozilla/5.0 (Macintosh) Chrome/130")).toBe("native");
    expect(pickWeChatChannel(null)).toBe("native");
  });
});
