import { describe, expect, it } from "vitest";
import type { Profile } from "@/lib/personality";
import { buildReportData, reportHighlights } from "@/lib/report-content";

const CJK = /[㐀-鿿豈-﫿　-〿＀-￯]/;

const profiles: Profile[] = [
  { type: "INFJ", values: [79, 71, 64, 58], balanced: [false, false, false, true] },
  { type: "ENTP", values: [55, 85, 80, 95], balanced: [true, false, false, false] },
  { type: "ISFP", values: [55, 55, 55, 55], balanced: [true, true, true, true] },
];

describe("reportHighlights", () => {
  for (const locale of ["zh", "en"] as const) {
    it(`quotes one passage per chapter, verbatim from the ${locale} report`, () => {
      for (const profile of profiles) {
        const highlights = reportHighlights(profile, locale);
        expect(highlights.map((h) => h.chapter)).toEqual([0, 1, 2, 3]);
        const report = JSON.stringify(buildReportData(profile, { sample: true, demo: false, locale }));
        const quoted = (text: string) => report.includes(JSON.stringify(text).slice(1, -1));
        for (const { chapter, title, body, say, both } of highlights) {
          // Chapter 01's title is a dimension's label and letter, which the report prints side by side.
          if (chapter > 0) expect(quoted(title), title).toBe(true);
          // A near-even dimension lists both ends as label and strength, one per line.
          const passages = both ? body!.split("\n").map((line) => line.split(/：|: /)[1]) : [body];
          for (const passage of passages) if (passage) expect(quoted(passage), passage).toBe(true);
          if (say) expect(quoted(say), say).toBe(true);
          expect(Boolean(body) !== Boolean(say)).toBe(true);
        }
        if (locale === "en") expect(JSON.stringify(highlights)).not.toMatch(CJK);
      }
    });
  }

  it("quotes the first dimension with a clear lean, and reads both ends when none leans", () => {
    const [, entp, isfp] = profiles;
    expect(reportHighlights(entp, "zh")[0].title).toBe("直觉 N");
    expect(reportHighlights(isfp, "zh")[0].both).toBe(true);
  });
});
