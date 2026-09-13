import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LEGACY_QUESTIONNAIRE_ID, STANDARD_QUESTIONNAIRE_ID } from "@/lib/questionnaires";
import { emptyProgress } from "@/lib/quiz-progress";

let values: Map<string, string>;
let blocked: boolean;
beforeEach(() => {
  vi.resetModules(); values = new Map(); blocked = false;
  vi.stubGlobal("window", { localStorage: {
    getItem: (key: string) => { if (blocked) throw new Error("SecurityError"); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => { if (blocked) throw new Error("QuotaExceededError"); values.set(key, value); },
  }, addEventListener() {}, removeEventListener() {} });
});
afterEach(() => vi.unstubAllGlobals());

it("keeps current answers in memory when reading and writing persistent storage both fail", async () => {
  blocked = true;
  const store = await import("@/lib/client-storage");
  const draft = emptyProgress(STANDARD_QUESTIONNAIRE_ID);
  draft.answers[draft.questionOrder[0]] = 2;
  store.writeQuizProgress(draft);
  expect(store.readQuizProgress()?.answers[draft.questionOrder[0]]).toBe(2);
  expect(store.readQuizProgress()).toBe(store.readQuizProgress());
  store.writeQuizProgress({ ...store.readQuizProgress()!, index: 1 });
  expect(store.readQuizProgress()?.index).toBe(1);
  blocked = false;
  store.writeQuizProgress({ ...store.readQuizProgress()!, index: 2 });
  expect(values.get("mirror.quiz.v2")).toContain('"index":2');
});

it("does not fall back to stale answers after quota failure and clears completed drafts in memory", async () => {
  const store = await import("@/lib/client-storage");
  store.writeQuizProgress(emptyProgress(LEGACY_QUESTIONNAIRE_ID));
  blocked = true;
  const draft = store.readQuizProgress()!;
  store.writeQuizProgress({ ...draft, answers: { ...draft.answers, [draft.questionOrder[0]]: -2 } });
  expect(store.readQuizProgress()?.answers[draft.questionOrder[0]]).toBe(-2);
  store.writeQuizProgress(null);
  expect(store.readQuizProgress()).toBeNull();
});

it("keeps both versions separate and never resurrects completed legacy local storage", async () => {
  values.set("mirror.quiz.v1", JSON.stringify({ answers: Array(32).fill(1), index: 9, updatedAt: 1 }));
  const store = await import("@/lib/client-storage");
  expect(store.readQuizProgress()?.index).toBe(9);
  store.writeQuizProgress(emptyProgress(STANDARD_QUESTIONNAIRE_ID));
  expect(store.readQuizProgress(LEGACY_QUESTIONNAIRE_ID)?.index).toBe(9);
  store.writeQuizProgress(null);
  expect(store.readQuizProgress()?.questionnaireId).toBe(LEGACY_QUESTIONNAIRE_ID);
  store.writeQuizProgress(null);
  expect(store.readQuizProgress()).toBeNull();
});
