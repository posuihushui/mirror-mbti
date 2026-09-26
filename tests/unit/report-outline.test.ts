import { describe, expect, it } from "vitest";
import { TYPES, type Profile } from "@/lib/personality";
import { buildReportData, reportOutline } from "@/lib/report-content";
import { chapterLabelsFor } from "@/lib/site";

const CJK = /[一-鿿]/;

/** Every type, once leaning clearly and once near even on each dimension. */
const profiles: Profile[] = TYPES.flatMap((type) => [
  { type, values: [82, 77, 90, 64], balanced: [false, false, false, false] },
  { type, values: [52, 58, 55, 51], balanced: [true, true, true, true] },
  { type, values: [53, 80, 57, 76], balanced: [true, false, true, false] },
]);

describe("reportOutline", () => {
  it.each(["zh", "en"] as const)("gives the result page titles and cut openings, never the paid reading (%s)", (locale) => {
    for (const profile of profiles) {
      const outline = reportOutline(profile, locale);
      const data = buildReportData(profile, { sample: false, demo: false, locale });
      expect(outline.map((chapter) => chapter.label)).toEqual([...chapterLabelsFor(locale)]);
      expect(outline.map((chapter) => chapter.rest.length)).toEqual([3, 3, 3, 3]);
      expect(outline[1].extra).toEqual({ kind: "blindspots", count: 4 });
      expect(outline[3].extra).toEqual({ kind: "week", count: 7 });

      for (const { first } of outline) {
        if (locale === "en") expect(first.opening.split(/\s+/).length).toBeLessThanOrEqual(first.say ? 7 : 14);
        else expect(Array.from(first.opening.replace(/…$/, "")).length).toBeLessThanOrEqual(first.say ? 14 : 30);
      }

      // Chapter 01 opens on a pole's strength, which the old preview already showed; everything else the report writes stays out.
      const shipped = JSON.stringify(outline);
      const paid = [
        ...data.strengths.map((item) => item.body),
        ...data.blindspots.flatMap((item) => [item.title, item.body]),
        ...data.relationships.flatMap((item) => [item.body, item.say ?? ""]),
        ...data.work.map((item) => item.body),
        ...data.actionPlan.flatMap((item) => [item.title, item.body]),
        ...data.needs.map((need) => need.growth),
      ];
      for (const text of paid) expect(shipped).not.toContain(text);
      if (locale === "en") expect(shipped).not.toMatch(CJK);
    }
  });

  it("opens on the scene itself, not on the report's clear/slight qualifier", () => {
    const [, two, , four] = reportOutline(profiles[0], "zh");
    expect(two.first.opening).not.toMatch(/^这次/);
    expect(four.first.opening).not.toMatch(/^这次/);
  });
});
