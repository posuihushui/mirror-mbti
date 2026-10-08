import "server-only";
import type postgres from "postgres";
import { createSql } from "@mirror/db";
const state = globalThis as unknown as { adminSql?: postgres.Sql };
export function adminDb() {
  const url = process.env.ADMIN_DATABASE_URL;
  if (!url) throw new Error("ADMIN_DATABASE_URL is not configured");
  return state.adminSql ??= createSql(url, { max: 5, idle_timeout: 20, connect_timeout: 5, connection: { application_name: "mirror-admin", statement_timeout: 10000 } });
}
/** Every business query runs in a read-only snapshot, even with an overprivileged local role. */
export async function readOnly<T>(work: (sql: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return await adminDb().begin("isolation level repeatable read read only", work) as T;
}
export async function consumeLoginAttempt() {
  const rows = await adminDb()`insert into admin_login_attempts (bucket, attempts, window_started_at) values ('single-admin', 1, now())
    on conflict (bucket) do update set
      attempts = case when admin_login_attempts.window_started_at < now() - interval '15 minutes' then 1 else least(admin_login_attempts.attempts + 1, 31) end,
      window_started_at = case when admin_login_attempts.window_started_at < now() - interval '15 minutes' then now() else admin_login_attempts.window_started_at end
    returning attempts, greatest(1, ceil(extract(epoch from window_started_at + interval '15 minutes' - now())))::int as retry_after`;
  return { allowed: rows[0].attempts <= 30, retryAfter: Number(rows[0].retry_after) };
}
