import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { claimFirstReferral } from "@/lib/share-analytics";
import { lockVisitor } from "@/lib/share-request";
import { newResultId } from "@/lib/ids";
import { calculate, sampleProfile, uniformAnswers, type Profile } from "@/lib/personality";
import { getQuestionnaire, LEGACY_QUESTIONNAIRE_ID, REPORT_VERSION, SCORING_VERSION, type QuestionnaireId } from "@/lib/questionnaires";

export const SAMPLE_RESULT_ID = "sample";

export type ResultView = {
  id: string;
  profile: Profile;
  sample: boolean;
  /** Whether the requesting visitor owns this result. */
  owner: boolean;
  /** Whether the full report has been paid for. */
  unlocked: boolean;
  /** Set when one option ran long enough to suggest a click-through. Invites a review; blocks nothing. */
  uniform: boolean;
  createdAt: Date | null;
  questionnaireId: string;
  questionCount: number;
  scoringVersion: string;
  reportVersion: string;
};

export function sampleResult(): ResultView {
  return { id: SAMPLE_RESULT_ID, profile: sampleProfile, sample: true, owner: false, unlocked: true, uniform: false, createdAt: null, questionnaireId: LEGACY_QUESTIONNAIRE_ID, questionCount: 32, scoringVersion: SCORING_VERSION, reportVersion: REPORT_VERSION };
}

export async function ensureVisitor(visitorId: string, userAgent?: string | null) {
  await db()
    .insert(schema.visitors)
    .values({ id: visitorId, userAgent: userAgent ?? null })
    .onConflictDoUpdate({ target: schema.visitors.id, set: { lastSeenAt: new Date() } });
}

export async function createResult(visitorId: string, answers: number[], userAgent?: string | null, questionnaireId: QuestionnaireId = LEGACY_QUESTIONNAIRE_ID): Promise<ResultView> {
  await ensureVisitor(visitorId, userAgent);
  const profile = calculate(answers, questionnaireId);
  const questionnaire = getQuestionnaire(questionnaireId)!;
  const version = { questionnaireId, questionCount: questionnaire.count, scoringVersion: SCORING_VERSION, reportVersion: REPORT_VERSION };
  const id = newResultId();
  await db().transaction(async (tx) => {
    await lockVisitor(tx, visitorId);
    const [previous] = await tx.select({ id: schema.results.id }).from(schema.results).where(eq(schema.results.visitorId, visitorId)).limit(1);
    const createdAt = new Date();
    await tx.insert(schema.results).values({
    id,
    visitorId,
    answers,
    ...version,
    responses: questionnaire.questions.map((q, i) => ({ questionId: q.id, value: answers[i] })),
    type: profile.type,
    values: profile.values,
    balanced: profile.balanced,
    createdAt,
    });
    if (!previous) await claimFirstReferral(tx, visitorId, id, createdAt);
  });
  return { id, profile, sample: false, owner: true, unlocked: false, uniform: uniformAnswers(answers), createdAt: new Date(), ...version };
}

function toView(row: Omit<typeof schema.results.$inferSelect, "answers" | "responses"> & { answers?: number[] }, visitorId: string | null): ResultView {
  return {
    id: row.id,
    profile: { type: row.type, values: row.values, balanced: row.balanced },
    sample: false,
    owner: visitorId === row.visitorId,
    unlocked: row.unlockedAt !== null,
    uniform: row.answers ? uniformAnswers(row.answers) : false,
    createdAt: row.createdAt,
    questionnaireId: row.questionnaireId,
    questionCount: row.questionCount,
    scoringVersion: row.scoringVersion,
    reportVersion: row.reportVersion,
  };
}

export async function getResult(id: string, visitorId: string | null): Promise<ResultView | null> {
  if (id === SAMPLE_RESULT_ID) return sampleResult();
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return null;
  const row = await db().query.results.findFirst({ where: eq(schema.results.id, id) });
  return row ? toView(row, visitorId) : null;
}

export async function latestResultForVisitor(visitorId: string): Promise<ResultView | null> {
  const row = await db().query.results.findFirst({
    where: eq(schema.results.visitorId, visitorId),
    orderBy: [desc(schema.results.createdAt)],
  });
  return row ? toView(row, visitorId) : null;
}

export type ResultHistoryItem = ResultView & {
  order: { id: string; provider: typeof schema.orders.$inferSelect.provider; status: typeof schema.orders.$inferSelect.status } | null;
};

/** Owner-only history, including unpaid results. Neither raw answers nor payment payloads leave the data layer. */
export async function resultsForVisitor(visitorId: string): Promise<ResultHistoryItem[]> {
  const [rows, orders] = await Promise.all([
    db().query.results.findMany({
      where: eq(schema.results.visitorId, visitorId),
      orderBy: [desc(schema.results.createdAt), desc(schema.results.id)],
      columns: { answers: false, responses: false },
    }),
    db().query.orders.findMany({
      // A result's own purchase only; gifts a host bought for an invitation carry the host's result too.
      where: and(eq(schema.orders.visitorId, visitorId), eq(schema.orders.kind, "report")),
      orderBy: [desc(schema.orders.createdAt), desc(schema.orders.id)],
      columns: { id: true, resultId: true, provider: true, status: true },
    }),
  ]);
  const latestOrders = new Map<string, (typeof orders)[number]>();
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  for (const order of orders) {
    if (!latestOrders.has(order.resultId)) latestOrders.set(order.resultId, order);
  }
  return rows.map((row) => {
    const order = (row.unlockOrderId && ordersById.get(row.unlockOrderId)) || latestOrders.get(row.id);
    return {
      ...toView(row, visitorId),
      order: order ? { id: order.id, provider: order.provider, status: order.status } : null,
    };
  });
}

/** Raw answers are exposed only to their owner when they explicitly review an existing result. */
export async function answersForReview(id: string, visitorId: string) {
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return null;
  const row = await db().query.results.findFirst({ where: and(eq(schema.results.id, id), eq(schema.results.visitorId, visitorId)) });
  if (!row) return null;
  const questionnaire = getQuestionnaire(row.questionnaireId);
  if (!questionnaire) return null;
  return { questionnaireId: questionnaire.id, responses: row.responses ?? questionnaire.questions.map((q, i) => ({ questionId: q.id, value: row.answers[i] })) };
}

export async function markResultUnlocked(resultId: string, orderId: string) {
  await db()
    .update(schema.results)
    .set({ unlockedAt: new Date(), unlockOrderId: orderId })
    .where(and(eq(schema.results.id, resultId)));
}
