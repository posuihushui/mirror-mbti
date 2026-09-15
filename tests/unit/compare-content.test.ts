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

describe("consented qualitative comparison", () => {
  it("classifies both near-balanced values as contextual, never a shared pole", () => {
    expect(compareRelation("EI", "balanced", "balanced")).toBe("includes-balanced");
    expect(compareRelation("EI", "E", "balanced")).toBe("includes-balanced");
    expect(compareRelation("EI", "E", "E")).toBe("same-left");
    expect(compareRelation("EI", "I", "I")).toBe("same-right");
    expect(compareRelation("EI", "I", "E")).toBe("opposite");
  });
  it.each(["zh", "en"] as const)("does not invent common ground for all-opposite categories (%s)", (locale) => {
    const output = generateCompareContent(left, right, locale);
    expect(output.sections).toHaveLength(3);
    expect(output.sections[0].body).toBe(compareMessages[locale].oppositeCommon);
    expect(output.sections[1].body).toBe(compareMessages[locale].opposite.EI);
    expect(output.sections[2].practice).toBe(compareMessages[locale].practices.EI);
    expect(output).toEqual(generateCompareContent(right, left, locale));
  });
  it.each(["zh", "en"] as const)("all-balanced stays contextual in all three sections (%s)", (locale) => {
    const output = generateCompareContent(balanced, balanced, locale);
    expect(output.sections[0].body).toBe(compareMessages[locale].balancedCommon);
    expect(output.sections[1].body).toBe(compareMessages[locale].balancedDifference);
    expect(output.sections[2].body).toBe(compareMessages[locale].balancedPracticeBody);
  });
  it("all-same avoids assuming identical needs and uses generic practice", () => {
    const output = generateCompareContent(left, left);
    expect(output.sections[0].body).toBe(compareMessages.zh.same.E);
    expect(output.sections[1].body).toBe(compareMessages.zh.sameDifference);
    expect(output.sections[2].practice).toBe(compareMessages.zh.genericPractice);
  });
  it("prioritises EI then JP then TF then SN, with practice tied to first opposite", () => {
    expect(COMPARE_DIMENSION_ORDER).toEqual(["EI", "JP", "TF", "SN"]);
    const guest = snapshot({ EI: "E", JP: "P", TF: "F", SN: "N" });
    const output = generateCompareContent(left, guest);
    expect(output.sections[0].body).toBe(compareMessages.zh.same.E);
    expect(output.sections[1].body).toBe(compareMessages.zh.opposite.JP);
    expect(output.sections[2].practice).toBe(compareMessages.zh.practices.JP);
  });
  it("selects contextual practice when no opposite exists", () => {
    const guest = snapshot({ ...left.categories, JP: "balanced", SN: "balanced" });
    const output = generateCompareContent(left, guest);
    expect(output.sections[0].body).toBe(compareMessages.zh.same.E);
    expect(output.sections[1].body).toBe(compareMessages.zh.balancedDifference);
    expect(output.sections[2].practice).toBe(compareMessages.zh.practices.JP);
  });
  it("retains neutral wording across questionnaire versions and result languages", () => {
    const output = generateCompareContent(left, snapshot(left.categories, "en64-v1"), "en");
    expect(output.differentQuestionnaires).toBe(true);
    expect(output.locale).toBe("en");
    expect(output.contentVersion).toBe("compare-v1");
    expect(output.sections).toEqual(generateCompareContent(left, left, "en").sections);
  });
  it("copies no extra source information into output", () => {
    const contaminated = { ...left, resultId: "private-result", profile: { type: "ESTJ", values: [88] }, orderNumber: "secret" };
    const output = generateCompareContent(contaminated, right);
    expect(Object.keys(output).sort()).toEqual(["contentVersion", "differentQuestionnaires", "locale", "sections"]);
    expect(JSON.stringify(output)).not.toMatch(/private-result|ESTJ|secret|88|2026-09-15|legacy32/);
  });
  it("is deterministic and role-symmetric over every category combination", () => {
    const choices = [["E", "I", "balanced"], ["S", "N", "balanced"], ["T", "F", "balanced"], ["J", "P", "balanced"]] as const;
    const samples: CompareSnapshot[] = [];
    for (const EI of choices[0]) for (const SN of choices[1]) for (const TF of choices[2]) for (const JP of choices[3]) samples.push(snapshot({ EI, SN, TF, JP }));
    for (const host of samples) for (const guest of samples) {
      const output = generateCompareContent(host, guest);
      expect(output).toEqual(generateCompareContent(guest, host));
      expect(output.sections.every(({ title, body }) => title && body)).toBe(true);
      expect(output.sections).toHaveLength(3);
    }
  });
  it("keeps each generated paragraph within its specified language budget", () => {
    for (const locale of ["zh", "en"] as const) {
      const copy = compareMessages[locale];
      const strings = [...Object.values(copy.same), ...Object.values(copy.opposite), ...Object.values(copy.practices), copy.balancedCommon, copy.oppositeCommon, copy.balancedDifference, copy.sameDifference, copy.practiceBody, copy.balancedPracticeBody, copy.genericPractice];
      for (const value of strings) expect(locale === "zh" ? [...value].length : value.split(/\s+/u).length).toBeLessThanOrEqual(locale === "zh" ? 80 : 55);
    }
  });
});
