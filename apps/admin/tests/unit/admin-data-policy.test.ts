import { describe, expect, it } from "vitest";
import { filters, maskOrder, pageHref } from "../../src/lib/filters";
describe("admin filters", () => {
  it("uses inclusive Beijing dates with an exclusive upper bound", () => {
    const f = filters({ start: "2026-10-01", end: "2026-10-08" });
    expect(f.start.toISOString()).toBe("2026-09-30T16:00:00.000Z");
    expect(f.end.toISOString()).toBe("2026-10-08T16:00:00.000Z");
  });
  it("bounds dates, pagination and filter enums", () => {
    const f = filters({ start: "2026-02-30", end: "2026-10-08", page: "-99", status: "bad", provider: "' or true", kind: "x", locale: "other" });
    expect(f.startDate).toBe("2026-10-02"); expect(f.page).toBe(1);
    expect(f.status + f.provider + f.kind + f.locale).toBe("");
    expect(filters({ page: "Infinity" }).page).toBe(10000);
    expect(pageHref("/orders", { status: "paid", page: "1" }, 2)).toBe("/orders?status=paid&page=2");
  });
  it("masks bearer recovery credentials", () => {
    expect(maskOrder("M20261008ABCDEF123456ABCDEF1234")).not.toContain("ABCDEF123456ABCDEF1234");
  });
});
