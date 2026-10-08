import { getQuestionnaire, LEGACY_QUESTIONNAIRE_ID, type QuestionnaireId } from "@/lib/questionnaires";

export type QuizProgress = { questionnaireId: QuestionnaireId; questionOrder: string[]; answers: Record<string, number | null>; index: number; updatedAt: number };

export function emptyProgress(questionnaireId: QuestionnaireId): QuizProgress {
  const q = getQuestionnaire(questionnaireId)!;
  return { questionnaireId, questionOrder: q.questions.map((item) => item.id), answers: Object.fromEntries(q.questions.map((item) => [item.id, null])), index: 0, updatedAt: 0 };
}

/** Validates both identity and order; equal-length drafts from a different version cannot leak across. */
export function normalizeProgress(input: unknown): QuizProgress | null {
  if (!input || typeof input !== "object") return null;
  const p = input as Partial<QuizProgress>;
  const q = typeof p.questionnaireId === "string" ? getQuestionnaire(p.questionnaireId) : undefined;
  if (!q || !Array.isArray(p.questionOrder) || p.questionOrder.length !== q.count || !p.answers || typeof p.answers !== "object" || Array.isArray(p.answers)) return null;
  if (Object.keys(p.answers).length !== q.count || !q.questions.every((item, i) => p.questionOrder![i] === item.id && Object.hasOwn(p.answers!, item.id))) return null;
  if (!Object.values(p.answers).every((v) => v === null || (typeof v === "number" && Number.isInteger(v) && v >= -2 && v <= 2))) return null;
  if (!Number.isInteger(p.index) || p.index! < 0 || p.index! >= q.count || typeof p.updatedAt !== "number" || !Number.isFinite(p.updatedAt)) return null;
  return p as QuizProgress;
}

export function migrateLegacyProgress(input: unknown): QuizProgress | null {
  if (!input || typeof input !== "object") return null;
  const p = input as { answers?: unknown; index?: unknown; updatedAt?: unknown };
  if (!Array.isArray(p.answers) || p.answers.length !== 32) return null;
  const next = emptyProgress(LEGACY_QUESTIONNAIRE_ID);
  return normalizeProgress({ ...next, answers: Object.fromEntries(next.questionOrder.map((id, i) => [id, (p.answers as unknown[])[i]])), index: p.index, updatedAt: p.updatedAt });
}
