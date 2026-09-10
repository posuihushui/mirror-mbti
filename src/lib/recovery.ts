import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { isValidOrderId } from "@/lib/ids";
import { RECOVERY_ATTEMPT_LIMIT, RECOVERY_WINDOW_SECONDS } from "@/lib/recovery-policy";

/** One atomic upsert shared by every process/replica; rejected requests also count. */
export async function consumeRecoveryAttempt(bucketKey: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const table = schema.recoveryAttempts;
  const expired = sql`${table.windowStartedAt} <= now() - (${RECOVERY_WINDOW_SECONDS} * interval '1 second')`;
  const [bucket] = await db()
    .insert(table)
    .values({ bucketKey })
    .onConflictDoUpdate({
      target: table.bucketKey,
      set: {
        attempts: sql`case when ${expired} then 1 else least(${table.attempts} + 1, ${RECOVERY_ATTEMPT_LIMIT + 1}) end`,
        windowStartedAt: sql`case when ${expired} then now() else ${table.windowStartedAt} end`,
      },
    })
    .returning({ attempts: table.attempts, windowStartedAt: table.windowStartedAt });

  // Bounded opportunistic cleanup keeps inactive hashes from accumulating.
  await db().execute(sql`delete from ${table} where ${table.bucketKey} in (
    select ${table.bucketKey} from ${table}
    where ${table.windowStartedAt} < now() - interval '1 day' limit 100
  )`);

  return {
    allowed: bucket.attempts <= RECOVERY_ATTEMPT_LIMIT,
    retryAfter: Math.max(1, Math.ceil((bucket.windowStartedAt.getTime() + RECOVERY_WINDOW_SECONDS * 1000 - Date.now()) / 1000)),
  };
}

/** A full order number recovers its owner; payment state never changes here. */
export async function visitorForRecoveryOrder(orderId: string): Promise<string | null> {
  if (!isValidOrderId(orderId)) return null;
  const order = await db().query.orders.findFirst({
    columns: { visitorId: true },
    where: eq(schema.orders.id, orderId),
  });
  return order?.visitorId ?? null;
}
