import postgres from "postgres";
async function main() {
  if (!process.env.ADMIN_MAINTENANCE_DATABASE_URL) throw new Error("Set ADMIN_MAINTENANCE_DATABASE_URL explicitly");
  if (process.argv.slice(2).some(a => a !== "--apply")) throw new Error("Only --apply is supported; without it the operation is read-only");
  const apply = process.argv.includes("--apply"); const sql = postgres(process.env.ADMIN_MAINTENANCE_DATABASE_URL, { max: 1 });
  try {
    const rows = await sql.begin(apply ? "" : "read only", async tx => {
      await tx`set local statement_timeout = '30s'`;
      if (!apply) return tx`select (select count(*)::int from browser_events where created_at < now() - interval '90 days') as browser_events, (select count(*)::int from telegram_outbox where delivered_at < now() - interval '90 days') as delivered_notifications`;
      return tx`with b as (delete from browser_events where created_at < now() - interval '90 days' returning 1), t as (delete from telegram_outbox where delivered_at < now() - interval '90 days' returning 1) select (select count(*)::int from b) as browser_events, (select count(*)::int from t) as delivered_notifications`;
    });
    console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", counts: rows[0] }));
  } finally { await sql.end(); }
}
main().catch(() => { console.error("Maintenance failed. Check explicit connection and migration; no credentials are logged."); process.exitCode = 1; });
