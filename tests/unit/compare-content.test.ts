import { describe, expect, it } from "vitest";
import { compareRelation, generateCompareContent } from "@/lib/compare-content";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { COMPARE_DIMENSION_ORDER, type CompareCategories, type CompareSnapshot } from "@/lib/compare-types";

const snapshot = (categories: CompareCategories, questionnaireId: CompareSnapshot["questionnaireId"] = "legacy32-v1"): CompareSnapshot => ({
  categories, questionnaireId, createdAt: "2026-09-15T12:00:00.000Z",
});
const left = snapshot({ EI: "E", SN: "S", TF: "T", JP: "J" });
const right = snapshot({ EI: "I", SN: "N", TF: "F", JP: "P" });
const balanced = snapshot({ EI: "balanced", SN: "balanced", TF: "balanced", JP: "balanced" });
const card = (output: ReturnType<typeof generateCompareContent>, dimension: (typeof COMPARE_DIMENSION_ORDER)[number]) =>
  output.cards.find((entry) => entry.dimension === dimension)!;

describe("consented qualitative comparison", () => {
  it("classifies both near-balanced values as contextual, never a shared pole", () => {
    expect(compareRelation("EI", "balanced", "balanced")).toBe("includes-balanced");
    expect(compareRelation("EI", "E", "balanced")).toBe("includes-balanced");
    expect(compareRelation("EI", "E", "E")).toBe("same-left");
    expect(compareRelation("EI", "I", "I")).toBe("same-right");
    expect(compareRelation("EI", "I", "E")).toBe("opposite");
  });
  it.each(["zh", "en"] as const)("gives every consented dimension its own card, in reading order (%s)", (locale) => {
    const output = generateCompareContent(left, snapshot({ EI: "E", SN: "N", TF: "balanced", JP: "P" }), locale);
    expect(output.cards.map(({ dimension }) => dimension)).toEqual([...COMPARE_DIMENSION_ORDER]);
    expect(output.cards.map(({ relation }) => relation)).toEqual(["same-left", "opposite", "includes-balanced", "opposite"]);
    expect(card(output, "EI").body).toBe(compareMessages[locale].same.E);
    expect(card(output, "JP").body).toBe(compareMessages[locale].opposite.JP);
    expect(card(output, "TF").body).toBe(compareMessages[locale].contextual.TF);
    expect(card(output, "SN").body).toBe(compareMessages[locale].opposite.SN);
    for (const entry of output.cards) expect(entry.scene).toBe(compareMessages[locale].scenes[entry.dimension][entry.relation]);
  });
  it.each(["zh", "en"] as const)("does not invent common ground for all-opposite categories (%s)", (locale) => {
    const output = generateCompareContent(left, right, locale);
    expect(output.cards.every(({ relation }) => relation === "opposite")).toBe(true);
    expect(output.highlight.dimension).toBe("EI");
    expect(output.highlight.body).toBe(compareMessages[locale].highlights.opposite.EI);
    expect(output.highlight.openingLine).toBe(compareMessages[locale].openingLines.EI);
    expect(output.practice).toBe(compareMessages[locale].practices.EI);
    expect(output).toEqual(generateCompareContent(right, left, locale));
  });
  it.each(["zh", "en"] as const)("all-balanced stays contextual and singles out no dimension (%s)", (locale) => {
    const output = generateCompareContent(balanced, balanced, locale);
    expect(output.cards.every(({ relation }) => relation === "includes-balanced")).toBe(true);
    expect(output.highlight.dimension).toBeUndefined();
    expect(output.highlight.body).toBe(compareMessages[locale].highlights.allContextual);
    expect(output.highlight.openingLine).toBe(compareMessages[locale].genericOpeningLine);
    expect(output.practice).toBe(compareMessages[locale].genericPractice);
  });
  it("all-same avoids assuming identical needs and uses generic practice", () => {
    const output = generateCompareContent(left, left);
    expect(output.cards.map(({ body }) => body)).toEqual([compareMessages.zh.same.E, compareMessages.zh.same.J, compareMessages.zh.same.T, compareMessages.zh.same.S]);
    expect(output.highlight.dimension).toBeUndefined();
    expect(output.highlight.body).toBe(compareMessages.zh.highlights.similar);
    expect(output.practice).toBe(compareMessages.zh.genericPractice);
    expect(output.highlight.openingLine).toBe(compareMessages.zh.genericOpeningLine);
  });
  it("prioritises EI then JP then TF then SN for the emphasis", () => {
    expect(COMPARE_DIMENSION_ORDER).toEqual(["EI", "JP", "TF", "SN"]);
    const guest = snapshot({ EI: "E", JP: "P", TF: "F", SN: "N" });
    const output = generateCompareContent(left, guest);
    expect(card(output, "EI").body).toBe(compareMessages.zh.same.E);
    expect(output.highlight.dimension).toBe("JP");
    expect(output.highlight.body).toBe(compareMessages.zh.highlights.opposite.JP);
    expect(output.practice).toBe(compareMessages.zh.practices.JP);
    expect(output.highlight.openingLine).toBe(compareMessages.zh.openingLines.JP);
  });
  it("selects a contextual emphasis when no opposite exists", () => {
    const guest = snapshot({ ...left.categories, JP: "balanced", SN: "balanced" });
    const output = generateCompareContent(left, guest);
    expect(output.highlight.dimension).toBe("JP");
    expect(output.highlight.body).toBe(compareMessages.zh.highlights.contextual);
    expect(output.practice).toBe(compareMessages.zh.practices.JP);
  });
  it.each([
    { dimension: "EI", categories: { EI: "I", SN: "N", TF: "F", JP: "P" } },
    { dimension: "JP", categories: { EI: "E", SN: "N", TF: "F", JP: "P" } },
    { dimension: "TF", categories: { EI: "E", SN: "N", TF: "F", JP: "J" } },
    { dimension: "SN", categories: { EI: "E", SN: "N", TF: "T", JP: "J" } },
  ] as const)("keeps the emphasis, opening line and practice on the first differing dimension: $dimension", ({ dimension, categories }) => {
    for (const locale of ["zh", "en"] as const) {
      const output = generateCompareContent(left, snapshot(categories), locale);
      expect(output.highlight.dimension).toBe(dimension);
      expect(output.highlight.body).toBe(compareMessages[locale].highlights.opposite[dimension]);
      expect(output.highlight.openingLine).toBe(compareMessages[locale].openingLines[dimension]);
      expect(output.practice).toBe(compareMessages[locale].practices[dimension]);
      expect(card(output, dimension).body).toBe(compareMessages[locale].opposite[dimension]);
    }
  });
  it("retains neutral wording across questionnaire versions and result languages", () => {
    const output = generateCompareContent(left, snapshot(left.categories, "en64-v1"), "en");
    expect(output.differentQuestionnaires).toBe(true);
    expect(output.locale).toBe("en");
    expect(output.contentVersion).toBe("compare-v3");
    expect(output.cards).toEqual(generateCompareContent(left, left, "en").cards);
  });
  it("copies no extra source information into output", () => {
    const contaminated = { ...left, resultId: "private-result", profile: { type: "ESTJ", values: [88] }, orderNumber: "secret" };
    const output = generateCompareContent(contaminated, right);
    expect(Object.keys(output).sort()).toEqual(["cards", "contentVersion", "differentQuestionnaires", "highlight", "locale", "practice"]);
    expect(JSON.stringify(output)).not.toMatch(/private-result|ESTJ|secret|88|2026-09-15|legacy32/);
  });
  it.each(["zh", "en"] as const)("is deterministic, complete and role-symmetric over all 6,561 category pairs (%s)", (locale) => {
    const choices = [["E", "I", "balanced"], ["S", "N", "balanced"], ["T", "F", "balanced"], ["J", "P", "balanced"]] as const;
    const samples: CompareSnapshot[] = [];
    for (const EI of choices[0]) for (const SN of choices[1]) for (const TF of choices[2]) for (const JP of choices[3]) samples.push(snapshot({ EI, SN, TF, JP }));
    for (const host of samples) for (const guest of samples) {
      const output = generateCompareContent(host, guest, locale);
      expect(output).toEqual(generateCompareContent(guest, host, locale));
      expect(output.cards).toHaveLength(4);
      expect(output.cards.map(({ dimension }) => dimension)).toEqual([...COMPARE_DIMENSION_ORDER]);
      expect(output.cards.every(({ body, scene }) => body.length > 0 && scene.length > 0)).toBe(true);
      expect(output.highlight.body.length).toBeGreaterThan(0);
      expect(output.highlight.openingLine.length).toBeGreaterThan(0);
      expect(output.practice.length).toBeGreaterThan(0);
      if (locale === "en") expect(JSON.stringify(output)).not.toMatch(/[㐀-鿿]/u);
      expect(JSON.stringify(output)).not.toMatch(/\d+%|匹配率|兼容度|compatibility score|perfect partner/iu);
    }
  });
  it("varies the reading with every dimension rather than only the emphasised one", () => {
    const base = snapshot({ EI: "E", SN: "S", TF: "T", JP: "P" });
    const readings = new Set<string>();
    const choices = [["E", "I", "balanced"], ["S", "N", "balanced"], ["T", "F", "balanced"], ["J", "P", "balanced"]] as const;
    for (const EI of choices[0]) for (const SN of choices[1]) for (const TF of choices[2]) for (const JP of choices[3]) {
      readings.add(JSON.stringify(generateCompareContent(base, snapshot({ EI, SN, TF, JP })).cards));
    }
    // Every distinct set of categories a partner can bring produces a distinct reading.
    expect(readings.size).toBe(81);
  });
  it("keeps each generated paragraph within its specified language budget", () => {
    for (const locale of ["zh", "en"] as const) {
      const copy = compareMessages[locale];
      const strings = [
        ...Object.values(copy.same), ...Object.values(copy.opposite), ...Object.values(copy.contextual),
        ...Object.values(copy.scenes).flatMap((scenes) => Object.values(scenes)),
        ...Object.values(copy.highlights.opposite), copy.highlights.contextual, copy.highlights.allContextual, copy.highlights.similar,
        ...Object.values(copy.practices), ...Object.values(copy.openingLines),
        copy.genericOpeningLine, copy.genericPractice,
      ];
      for (const value of strings) expect(locale === "zh" ? [...value].length : value.split(/\s+/u).length).toBeLessThanOrEqual(locale === "zh" ? 80 : 55);
    }
  });
});
