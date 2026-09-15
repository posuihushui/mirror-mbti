import { describe, expect, it } from "vitest";
import { buildPublicShareSnapshot, buildShareCandidates, defaultShareSelection, buildPublicDimensions } from "@/lib/share-content";
import type { Profile } from "@/lib/personality";

const clear: Profile = { type: "INFJ", values: [79, 71, 64, 82], balanced: [false, false, false, false] };
const balanced: Profile = { type: "ESTJ", values: [50, 60, 55, 59], balanced: [true, true, true, true] };

describe("share-v1 public content", () => {
  it("returns dimension order and exact immutable copy in both languages", () => {
    expect(buildShareCandidates(clear).map(c => c.id)).toEqual(["share-v1:EI:I", "share-v1:SN:N", "share-v1:TF:F", "share-v1:JP:J"]);
    expect(buildShareCandidates(clear, "en")[0].text).toBe("I sometimes need time alone to gather my thoughts before sharing.");
  });
  it("chooses the strongest non-balanced dimensions and displays dimension order", () => {
    expect(defaultShareSelection(clear)).toEqual(["share-v1:EI:I", "share-v1:SN:N", "share-v1:JP:J"]);
    expect(defaultShareSelection({ ...clear, values: [70, 70, 70, 70] })).toEqual(buildShareCandidates(clear).slice(0, 3).map(c => c.id));
  });
  it("uses balanced copy regardless of the internal tie-break letters", () => {
    expect(buildShareCandidates(balanced)).toEqual(buildShareCandidates({ ...balanced, type: "INFP" }));
    expect(defaultShareSelection(balanced)).toEqual(["share-v1:EI:balanced", "share-v1:SN:balanced", "share-v1:TF:balanced"]);
    expect(buildPublicDimensions(balanced).every(d => d.state === "balanced")).toBe(true);
  });
  it("omits closed fields entirely and never exports private inputs", () => {
    const snapshot = buildPublicShareSnapshot(clear, "zh", defaultShareSelection(clear), false, false);
    expect(Object.keys(snapshot).sort()).toEqual(["disclaimer", "lines", "locale", "version"]);
    expect(JSON.stringify(snapshot)).not.toMatch(/INFJ|share-v1:EI|values|balanced|resultId/);
    expect(snapshot.lines).toHaveLength(3);
  });
  it("gives unclear types no determinate letters and notes partial balance", () => {
    for (const locale of ["zh", "en"] as const) {
      const snapshot = buildPublicShareSnapshot(balanced, locale, defaultShareSelection(balanced), true, true);
      expect(snapshot.typeLabel).not.toMatch(/ESTJ|INFP/);
      expect(snapshot.dimensions).toHaveLength(4);
      const partial = { ...clear, balanced: [false, false, false, true] };
      expect(buildPublicShareSnapshot(partial, locale, defaultShareSelection(partial), true, false).typeNote).toBeTruthy();
    }
  });
  it("rejects missing, duplicate, excessive and foreign candidate selections", () => {
    const ids = defaultShareSelection(clear);
    for (const selection of [[], ids.slice(0, 2), [...ids, "share-v1:TF:F"], [ids[0], ids[0], ids[1]], [ids[0], ids[1], "share-v1:JP:P"]]) {
      expect(() => buildPublicShareSnapshot(clear, "zh", selection, false, false)).toThrow("INVALID_SHARE_SELECTION");
    }
  });
  it("canonicalizes selected order and does not mutate inputs", () => {
    const ids = defaultShareSelection(clear);
    expect(buildPublicShareSnapshot(clear, "en", [...ids].reverse(), true, true)).toEqual(buildPublicShareSnapshot(clear, "en", ids, true, true));
    expect(clear.values).toEqual([79, 71, 64, 82]);
  });
});
