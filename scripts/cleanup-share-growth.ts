/** Explicit maintenance only; never scheduled automatically. No business rows are removed.
 * SHARE_GROWTH_DATABASE_URL=... npx tsx scripts/cleanup-share-growth.ts [--apply]
 */
import postgres from "postgres";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Set SHARE_GROWTH_DATABASE_URL explicitly. Default dry-run; --apply deletes events older than 90 days, attribution windows inactive for 180 days, continuations expired/completed for 30 days, and share rate limits older than 2 days. Never deletes results, shares, invitations, comparisons, orders or recovery records.");
    return;
  }
  if (args.some((arg) => arg !== "--apply")) throw new Error("Unknown argument; use --help");
  const databaseUrl = process.env.SHARE_GROWTH_DATABASE_URL;
  if (!databaseUrl) throw new Error("Set SHARE_GROWTH_DATABASE_URL explicitly; DATABASE_URL is deliberately not used");
  const apply = args.includes("--apply");
  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });
  try {
    const counts = await sql.begin(apply ? "" : "read only", async (tx) => {
      await tx`set local statement_timeout = '30s'`;
      if (apply) {
        // Count inside SQL; do not bring deleted IDs or tokens into the process.
        return tx`with events as (
          delete from share_events where occurred_at < now() - interval '90 days' returning 1
        ), attributions as (
          delete from referral_attributions where greatest(expires_at, completed_at) < now() - interval '180 days' returning 1
        ), limits as (
          delete from share_rate_limits where window_started_at < now() - interval '2 days' returning 1
        ), continuations as (
          delete from comparison_continuations where coalesce(completed_at, expires_at) < now() - interval '30 days' returning 1
        ) select (select count(*)::int from events) as events, (select count(*)::int from attributions) as attributions, (select count(*)::int from limits) as rate_limits, (select count(*)::int from continuations) as continuations`;
      }
      return tx`select
        (select count(*)::int from share_events where occurred_at < now() - interval '90 days') as events,
        (select count(*)::int from referral_attributions where greatest(expires_at, completed_at) < now() - interval '180 days') as attributions,
        (select count(*)::int from share_rate_limits where window_started_at < now() - interval '2 days') as rate_limits,
        (select count(*)::int from comparison_continuations where coalesce(completed_at, expires_at) < now() - interval '30 days') as continuations`;
    });
    console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", counts: counts[0], retention_days: { events: 90, attributions_after_window_end: 180, continuations_after_completion_or_expiry: 30, rate_limits: 2 }, note: "Business records and selection events within their own retention are retained. Existing results continue to establish returning-user status." }, null, 2));
  } finally { await sql.end({ timeout: 5 }); }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error && !('severity' in error) ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]") : "Maintenance query failed; verify schema and access without logging credentials.");
  process.exitCode = 1;
});
