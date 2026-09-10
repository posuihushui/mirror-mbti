import { describe, expect, it } from "vitest";
import { newOrderId, newResultId } from "@/lib/ids";
import { formatPriceFen } from "@/lib/site";
import { pickWeChatChannel } from "@/lib/ua";

describe("ids", () => {
  it("result ids are 12 url-safe chars", () => {
    for (let i = 0; i < 50; i++) expect(newResultId()).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });
  it("order ids fit WeChat out_trade_no rules and the API validator", () => {
    const id = newOrderId(new Date("2026-09-10T00:00:00Z"));
    expect(id).toMatch(/^M\d{8}[0-9A-F]{16}$/);
    expect(id.length).toBeLessThanOrEqual(32);
    expect(id.startsWith("M20260910")).toBe(true);
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
