import { describe, expect, it } from "vitest";
import { calculate, hasClearPreference, profileMeta, publicProfile, TYPES } from "@/lib/personality";
import { dimensions, LEGACY_QUESTIONNAIRE_ID, parseSubmission, questionnaires, STANDARD_QUESTIONNAIRE_ID } from "@/lib/questionnaires";
import { buildReportData } from "@/lib/report-content";
import { emptyProgress, migrateLegacyProgress, normalizeProgress } from "@/lib/quiz-progress";

for (const q of questionnaires) {
  describe(q.id, () => {
    it("keeps stable unique question IDs and equal coverage of both poles", () => {
      expect(q.questions).toHaveLength(q.count);
      expect(new Set(q.questions.map((item) => item.id)).size).toBe(q.count);
      for (const dimension of dimensions) {
        const items = q.questions.filter((item) => item.dimension === dimension);
        expect(items).toHaveLength(q.count / 4);
        expect(items.filter((item) => item.reverse)).toHaveLength(q.count / 8);
      }
    });
    it.each(TYPES)("scores %s with its own question definitions", (type) => {
      const answers = q.questions.map((item) => (type[dimensions.indexOf(item.dimension)] === item.dimension[0]) !== Boolean(item.reverse) ? 2 : -2);
      expect(calculate(answers, q.id)).toMatchObject({ type, values: [100, 100, 100, 100] });
    });
    it("accepts identified answers in any order but rejects duplicates and foreign questions", () => {
      const answers = q.questions.map((item) => ({ questionId: item.id, value: item.reverse ? -2 : 2 }));
      expect(parseSubmission({ questionnaireId: q.id, answers: [...answers].reverse() })?.answers).toEqual(answers.map((a) => a.value));
      expect(parseSubmission({ questionnaireId: q.id, answers: [answers[0], ...answers.slice(0, -1)] })).toBeNull();
      expect(parseSubmission({ questionnaireId: q.id, answers: [...answers.slice(0, -1), { questionId: "foreign", value: 1 }] })).toBeNull();
    });
    it("returns no determinate type for neutral or fully cancelling answers", () => {
      for (const value of [0, 1, 2, -1, -2]) {
        const profile = calculate(Array(q.count).fill(value), q.id);
        expect(hasClearPreference(profile)).toBe(false);
        expect(publicProfile(profile)).toMatchObject({ type: null, clear: false });
        expect(profileMeta(profile).name).toBe("倾向待探索");
      }
    });
  });
}

it("keeps the unversioned legacy API while refusing unidentifiable standard answers", () => {
  expect(parseSubmission({ answers: Array(32).fill(0) })?.questionnaire.id).toBe(LEGACY_QUESTIONNAIRE_ID);
  expect(parseSubmission({ questionnaireId: STANDARD_QUESTIONNAIRE_ID, answers: Array(64).fill(0) })).toBeNull();
  expect(parseSubmission({ questionnaireId: "unknown", answers: Array(32).fill(0) })).toBeNull();
});

it("keeps meaningful partial preferences and explains the remaining balanced axes", () => {
  const answers = questionnaires[0].questions.map((q) => q.dimension === "EI" ? q.reverse ? -2 : 2 : 0);
  const profile = calculate(answers);
  expect(hasClearPreference(profile)).toBe(true);
  expect(profile.balanced).toEqual([false, true, true, true]);
  expect(profileMeta(profile).summary).toContain("暂不做单侧判断");
});

it("migrates only valid frozen legacy drafts and rejects reordered or malformed drafts", () => {
  const legacy = migrateLegacyProgress({ answers: Array(32).fill(1), index: 4, updatedAt: 10 });
  expect(legacy?.answers["legacy32-q05"]).toBe(1);
  expect(legacy?.questionnaireId).toBe(LEGACY_QUESTIONNAIRE_ID);
  expect(migrateLegacyProgress({ answers: Array(32).fill(4), index: 0, updatedAt: 0 })).toBeNull();
  const draft = emptyProgress(STANDARD_QUESTIONNAIRE_ID);
  expect(normalizeProgress(draft)).toBe(draft);
  expect(normalizeProgress({ ...draft, questionOrder: [...draft.questionOrder].reverse() })).toBeNull();
  expect(normalizeProgress({ ...draft, questionnaireId: LEGACY_QUESTIONNAIRE_ID })).toBeNull();
});

it("changes paid guidance for strength and balance without recycling the public encyclopedia", () => {
  const options = { sample: false, demo: true };
  const strong = buildReportData({ type: "INFJ", values: [90, 85, 80, 95], balanced: [false, false, false, false] }, options);
  const mild = buildReportData({ type: "INFJ", values: [65, 66, 67, 68], balanced: [false, false, false, false] }, options);
  const balanced = buildReportData({ type: "INFJ", values: [55, 55, 55, 55], balanced: [true, true, true, true] }, options);
  expect(strong.strengths[0].body).not.toEqual(mild.strengths[0].body);
  expect(strong.relationships[0].body).not.toEqual(mild.relationships[0].body);
  expect(balanced.typeLabel).toBe("待探索");
  expect(balanced.strengths[0].body).toContain("不是“两边都擅长”");
  expect(strong.actionPlan).toHaveLength(7);
  expect(strong.actionPlan[1].body).not.toEqual(balanced.actionPlan[1].body);
});
