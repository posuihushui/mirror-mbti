import { describe, expect, it } from "vitest";
import { buildPublicShareSnapshot, buildShareCandidates, defaultShareSelection, buildPublicDimensions, SHARE_VARIANTS, shareDimensions } from "@/lib/share-content";
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
  it("publishes a balanced profile's letters only as a reference, always with a note", () => {
    for (const locale of ["zh", "en"] as const) {
      const snapshot = buildPublicShareSnapshot(balanced, locale, defaultShareSelection(balanced), true, true);
      expect(snapshot.typeLabel).toBe("ESTJ");
      expect(snapshot.typeNote).toBeTruthy();
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
  it("gives one result one fixed wording, whatever rebuilds the card", () => {
    for (const locale of ["zh", "en"] as const) {
      const first = buildShareCandidates(clear, locale, "result-aaa");
      expect(buildShareCandidates(clear, locale, "result-aaa")).toEqual(first);
      // The preview, the stored snapshot and a later rebuild must all read the same.
      const ids = defaultShareSelection(clear);
      const lines = buildPublicShareSnapshot(clear, locale, ids, false, false, "result-aaa").lines;
      expect(lines).toEqual(first.filter((candidate) => ids.includes(candidate.id)).map((candidate) => candidate.text));
    }
    // Seeding never moves a candidate's identity, so stored selections stay valid.
    expect(buildShareCandidates(clear, "zh", "result-aaa").map(c => c.id)).toEqual(buildShareCandidates(clear).map(c => c.id));
  });
  it("spreads wording across results so two people rarely post the same sentence", () => {
    const seeds = Array.from({ length: 300 }, (_, index) => `result-${index.toString(36)}`);
    for (const dimension of shareDimensions) {
      const index = shareDimensions.indexOf(dimension);
      const seen = new Set(seeds.map((seed) => buildShareCandidates(clear, "zh", seed)[index].text));
      expect(seen.size).toBe(SHARE_VARIANTS);
    }
    // Every wording a seed can produce still belongs to that dimension and state.
    const unseeded = buildShareCandidates(clear, "zh");
    for (const seed of seeds) {
      const seeded = buildShareCandidates(clear, "zh", seed);
      for (const [index, candidate] of seeded.entries()) expect(candidate.id).toBe(unseeded[index].id);
    }
  });
  it("keeps every wording within the card's line budget and in one language", () => {
    for (const locale of ["zh", "en"] as const) {
      const seeds = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
      for (const profile of [clear, balanced, { ...clear, balanced: [false, true, false, true] } as typeof clear]) {
        for (const seed of seeds) for (const candidate of buildShareCandidates(profile, locale, seed)) {
          expect(locale === "zh" ? [...candidate.text].length : candidate.text.split(/\s+/u).length).toBeLessThanOrEqual(locale === "zh" ? 26 : 16);
          if (locale === "en") expect(candidate.text).not.toMatch(/[\u3400-\u9fff]/u);
          else expect(candidate.text).toMatch(/[\u3400-\u9fff]/u);
        }
      }
    }
  });
  it("canonicalizes selected order and does not mutate inputs", () => {
    const ids = defaultShareSelection(clear);
    expect(buildPublicShareSnapshot(clear, "en", [...ids].reverse(), true, true)).toEqual(buildPublicShareSnapshot(clear, "en", ids, true, true));
    expect(clear.values).toEqual([79, 71, 64, 82]);
  });
});
