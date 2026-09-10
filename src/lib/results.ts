import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { newResultId } from "@/lib/ids";
import { calculate, sampleProfile, type Profile } from "@/lib/personality";

export const SAMPLE_RESULT_ID = "sample";

export type ResultView = {
  id: string;
  profile: Profile;
  sample: boolean;
  /** Whether the requesting visitor owns this result. */
  owner: boolean;
  /** Whether the full report has been paid for. */
  unlocked: boolean;
  createdAt: Date | null;
};

export function sampleResult(): ResultView {
  return { id: SAMPLE_RESULT_ID, profile: sampleProfile, sample: true, owner: false, unlocked: true, createdAt: null };
}

export async function ensureVisitor(visitorId: string, userAgent?: string | null) {
  await db()
    .insert(schema.visitors)
    .values({ id: visitorId, userAgent: userAgent ?? null })
    .onConflictDoUpdate({ target: schema.visitors.id, set: { lastSeenAt: new Date() } });
}

export async function createResult(visitorId: string, answers: number[], userAgent?: string | null): Promise<ResultView> {
  await ensureVisitor(visitorId, userAgent);
  const profile = calculate(answers);
  const id = newResultId();
  await db().insert(schema.results).values({
    id,
    visitorId,
    answers,
    type: profile.type,
    values: profile.values,
    balanced: profile.balanced,
  });
  return { id, profile, sample: false, owner: true, unlocked: false, createdAt: new Date() };
}

function toView(row: typeof schema.results.$inferSelect, visitorId: string | null): ResultView {
  return {
    id: row.id,
    profile: { type: row.type, values: row.values, balanced: row.balanced },
    sample: false,
    owner: visitorId === row.visitorId,
    unlocked: row.unlockedAt !== null,
    createdAt: row.createdAt,
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
  order: { id: string; provider: "mock" | "wechat"; status: typeof schema.orders.$inferSelect.status } | null;
};

/** Owner-only history, including unpaid results. Neither raw answers nor payment payloads leave the data layer. */
export async function resultsForVisitor(visitorId: string): Promise<ResultHistoryItem[]> {
  const [rows, orders] = await Promise.all([
    db().query.results.findMany({
      where: eq(schema.results.visitorId, visitorId),
      orderBy: [desc(schema.results.createdAt), desc(schema.results.id)],
      columns: { answers: false },
    }),
    db().query.orders.findMany({
      where: eq(schema.orders.visitorId, visitorId),
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
      id: row.id,
      profile: { type: row.type, values: row.values, balanced: row.balanced },
      sample: false,
      owner: true,
      unlocked: row.unlockedAt !== null,
      createdAt: row.createdAt,
      order: order ? { id: order.id, provider: order.provider, status: order.status } : null,
    };
  });
}

export async function markResultUnlocked(resultId: string, orderId: string) {
  await db()
    .update(schema.results)
    .set({ unlockedAt: new Date(), unlockOrderId: orderId })
    .where(and(eq(schema.results.id, resultId)));
}
