import { describe, expect, it } from "vitest";
import { href } from "@/lib/i18n/locale";
import { requestLocale } from "@/lib/i18n/request";
import { llmsFullText, llmsText } from "@/lib/llms";
import { TYPES, typeMeta } from "@/lib/personality";
import {
  EN_QUICK_QUESTIONNAIRE_ID,
  EN_STANDARD_QUESTIONNAIRE_ID,
  getQuestionnaire,
  LEGACY_QUESTIONNAIRE_ID,
  questionnaireLocale,
  questionnairesFor,
  STANDARD_QUESTIONNAIRE_ID,
} from "@/lib/questionnaires";
import { buildReportData } from "@/lib/report-content";
import { pageMetadata } from "@/lib/seo";
import { faqsFor } from "@/lib/site";
import { typeContext } from "@/lib/type-context";

const CJK = /[一-鿿]/;

describe("English questionnaires", () => {
  it.each([
    [EN_QUICK_QUESTIONNAIRE_ID, LEGACY_QUESTIONNAIRE_ID],
    [EN_STANDARD_QUESTIONNAIRE_ID, STANDARD_QUESTIONNAIRE_ID],
  ])("%s mirrors %s item by item, so scoring is identical", (enId, zhId) => {
    const en = getQuestionnaire(enId)!;
    const zh = getQuestionnaire(zhId)!;
    expect(en.count).toBe(zh.count);
    expect(en.questions.map((q) => [q.dimension, Boolean(q.reverse)])).toEqual(zh.questions.map((q) => [q.dimension, Boolean(q.reverse)]));
    expect(new Set(en.questions.map((q) => q.id)).size).toBe(en.count);
    for (const q of en.questions) expect(q.text).not.toMatch(CJK);
  });

  it("each locale offers only its own versions, and a result's language follows its questionnaire", () => {
    expect(questionnairesFor("zh").map((q) => q.id)).toEqual([LEGACY_QUESTIONNAIRE_ID, STANDARD_QUESTIONNAIRE_ID]);
    expect(questionnairesFor("en").map((q) => q.id)).toEqual([EN_QUICK_QUESTIONNAIRE_ID, EN_STANDARD_QUESTIONNAIRE_ID]);
    expect(questionnaireLocale(EN_STANDARD_QUESTIONNAIRE_ID)).toBe("en");
    expect(questionnaireLocale(LEGACY_QUESTIONNAIRE_ID)).toBe("zh");
    expect(questionnaireLocale("unknown")).toBe("zh");
  });
});

describe("locale routing helpers", () => {
  it("keeps Chinese unprefixed and prefixes English", () => {
    expect(href("zh", "/")).toBe("/");
    expect(href("zh", "/quiz")).toBe("/quiz");
    expect(href("en", "/")).toBe("/en");
    expect(href("en", "/types/INFJ")).toBe("/en/types/INFJ");
  });

  it("reads API message language from the same-origin referer", () => {
    const req = (referer?: string) => new Request("https://mirror.example/api/orders", { headers: referer ? { referer } : {} });
    expect(requestLocale(req("https://mirror.example/en/result/abc"))).toBe("en");
    expect(requestLocale(req("https://mirror.example/result/abc"))).toBe("zh");
    expect(requestLocale(req("not a url"))).toBe("zh");
    expect(requestLocale(req())).toBe("zh");
  });
});

describe("English content", () => {
  it("uses preference labels instead of type nicknames", () => {
    expect(typeMeta("INFJ", "en").name).toBe("Introverted · Intuitive · Feeling · Judging");
    expect(typeMeta("INFJ").name).toBe("提倡者");
  });

  it("contains no Chinese in type pages, the paid report or the FAQ", () => {
    for (const type of TYPES) {
      const meta = typeMeta(type, "en");
      const context = typeContext(type, "en");
      expect([meta.name, meta.line, meta.summary, context.definition, ...context.everyday, ...context.misconceptions, context.communication].join(" ")).not.toMatch(CJK);
    }
    const profiles = [
      { type: "ENTP", values: [90, 85, 80, 95], balanced: [false, false, false, false] },
      { type: "INFJ", values: [79, 71, 64, 58], balanced: [false, false, false, true] },
      { type: "ISFP", values: [55, 55, 55, 55], balanced: [true, true, true, true] },
    ];
    for (const profile of profiles) {
      const report = buildReportData(profile, { sample: false, demo: true, locale: "en" });
      expect(JSON.stringify(report)).not.toMatch(CJK);
    }
    expect(JSON.stringify(faqsFor("en"))).not.toMatch(CJK);
  });
});

describe("English SEO", () => {
  it("builds prefixed canonical, hreflang pairs and the English share image", () => {
    const meta = pageMetadata({ locale: "en", title: "The 16 personality types", description: "d", path: "/types" });
    expect(meta.alternates?.canonical).toBe("/en/types");
    expect(meta.alternates?.languages).toEqual({ "zh-CN": "/types", en: "/en/types", "x-default": "/types" });
    expect(meta.openGraph).toMatchObject({ locale: "en_US", url: "/en/types", siteName: "mirror" });
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/en/opengraph-image" })]);
  });

  it("English llms files link English pages only and never quote an amount", () => {
    const ctx = { baseUrl: "https://mirror.example" };
    const text = llmsText(ctx, "en");
    expect(text).toContain("](https://mirror.example/en/types/INFJ)");
    expect(text).toContain("The test, your type and a short overview are free.");
    // Nothing before the test may quote a price or hint at one.
    expect(text).not.toMatch(/\$\s?\d|\bpaid\b|\bunlock|\bpricing\b/i);
    expect(text).toContain("](https://mirror.example/llms.txt)");
    expect(text).not.toMatch(/\]\(https:\/\/mirror\.example\/(quiz|types|about)/);
    expect(llmsFullText(ctx, "en")).toContain(typeContext("ENTP", "en").definition);
  });
});
