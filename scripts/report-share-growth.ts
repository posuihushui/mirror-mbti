/**
 * First-touch association report, not causal uplift. No visitor/token/order details leave SQL.
 * SHARE_GROWTH_DATABASE_URL=... npx tsx scripts/report-share-growth.ts --start 2026-09-01 --end 2026-09-15 [--format csv]
 * Dates are UTC; end is exclusive. No .env is loaded and no application DB singleton is imported.
 */
import postgres from "postgres";

const DAY = 86_400_000;
const args = process.argv.slice(2);
function option(name: string) { const at = args.indexOf(name); return at < 0 ? undefined : args[at + 1]; }
function dateOption(name: string) {
  const value = option(name);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${name} must be YYYY-MM-DD (UTC)`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) throw new Error(`${name} is not a valid date`);
  return date;
}
async function main() {
  if (args.includes("--help")) {
    console.log("Set SHARE_GROWTH_DATABASE_URL explicitly. --start YYYY-MM-DD --end YYYY-MM-DD [--format json|csv]. UTC [start,end); read-only. Requires complete 90-day event / 180-day attribution retention.");
    return;
  }
  for (let i = 0; i < args.length; i += 2) {
    if (!["--start", "--end", "--format"].includes(args[i]) || !args[i + 1]) throw new Error("Unknown or missing argument; use --help");
  }
  const start = dateOption("--start"), end = dateOption("--end"), now = new Date();
  const format = option("--format") ?? "json";
  if (!["json", "csv"].includes(format)) throw new Error("--format must be json or csv");
  if (+end <= +start || +end > +now) throw new Error("Require start < end <= current time");
  if (+start < +now - 90 * DAY) throw new Error("DATA_INCOMPLETE: requested period exceeds 90-day event retention (attributions retained 180 days); historical rates are withheld");
  const databaseUrl = process.env.SHARE_GROWTH_DATABASE_URL;
  if (!databaseUrl) throw new Error("Set SHARE_GROWTH_DATABASE_URL explicitly; DATABASE_URL is deliberately not used");
  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });
  try {
    const rows = await sql.begin("isolation level repeatable read read only", async (tx) => {
      await tx`set local statement_timeout = '30s'`;
      return tx`
      with bounds as (select ${start}::timestamptz as lo, ${end}::timestamptz as hi, ${now}::timestamptz as observed),
      first_results as (
        select visitor_id, min(created_at) as first_at from results group by visitor_id
      ), base as (
        select r.*, r.first_at + interval '7 days' <= b.observed as mature
        from first_results r cross join bounds b where r.first_at >= b.lo and r.first_at < b.hi
      ), seed_first as (
        select visitor_id, min(created_at) as seed_at from result_shares group by visitor_id
      ), seeds as (
        select s.*, s.seed_at + interval '14 days' <= b.observed as mature
        from seed_first s cross join bounds b where s.seed_at >= b.lo and s.seed_at < b.hi
      ), touches as (
        select a.*, a.first_touch_at + interval '7 days' <= b.observed as mature
        from referral_attributions a join result_shares s on s.id = a.share_id cross join bounds b
        where a.first_touch_at >= b.lo and a.first_touch_at < b.hi and a.visitor_id <> s.visitor_id
      ), completed as (
        select a.*, s.visitor_id as owner_id
        from referral_attributions a join result_shares s on s.id = a.share_id
        where a.completed_at is not null and a.completed_at >= a.first_touch_at
          and a.completed_at < a.expires_at and a.visitor_id <> s.visitor_id
      ), paying_cohort as (
        select a.*, a.completed_at + interval '7 days' <= b.observed as mature
        from completed a cross join bounds b where a.completed_at >= b.lo and a.completed_at < b.hi
      ), revenue as (
        select o.currency, o.status, count(distinct o.visitor_id)::int as visitors,
          count(*)::int as orders, coalesce(sum(o.amount_fen),0)::bigint as amount_minor
        from orders o join paying_cohort p on p.visitor_id = o.visitor_id
        where p.mature and o.provider <> 'mock' and o.status in ('paid','refunded')
          and o.paid_at >= p.completed_at and o.paid_at < p.completed_at + interval '7 days'
        group by o.currency, o.status
      )
      select
        (select count(*)::int from base) as base_users,
        (select count(*)::int from base where mature) as base_mature,
        (select count(*)::int from base r where exists(select 1 from result_shares s where s.visitor_id = r.visitor_id and s.created_at >= r.first_at and s.created_at < r.first_at + interval '7 days')) as base_creators_observed,
        (select count(*)::int from base r where mature and exists(select 1 from result_shares s where s.visitor_id = r.visitor_id and s.created_at >= r.first_at and s.created_at < r.first_at + interval '7 days')) as base_creators_mature,
        (select count(distinct s.visitor_id)::int from result_shares s join first_results r on r.visitor_id = s.visitor_id cross join bounds b where s.created_at >= b.lo and s.created_at < b.hi and r.first_at < b.lo) as old_creators,
        (select count(*)::int from result_shares s cross join bounds b where s.created_at >= b.lo and s.created_at < b.hi) as shares_created,
        (select count(distinct e.actor_visitor_id)::int from share_events e join result_shares s on s.id = e.share_id cross join bounds b where e.event_name = 'share_browser_visible' and e.occurred_at >= b.lo and e.occurred_at < b.hi and e.actor_visitor_id <> s.visitor_id) as visible_visitors,
        (select count(*)::int from touches) as touches_observed,
        (select count(*)::int from touches where mature) as touches_mature,
        (select count(*)::int from touches where completed_at >= first_touch_at and completed_at < expires_at) as touch_completed_observed,
        (select count(*)::int from touches where mature and completed_at >= first_touch_at and completed_at < expires_at) as touch_completed_mature,
        (select count(*)::int from completed a join base r on r.visitor_id = a.owner_id where a.completed_at >= r.first_at and a.completed_at < r.first_at + interval '7 days') as first_completion_children_observed,
        (select count(*)::int from completed a join base r on r.visitor_id = a.owner_id where r.mature and a.completed_at >= r.first_at and a.completed_at < r.first_at + interval '7 days') as first_completion_children_mature,
        (select count(*)::int from seeds) as seeds_observed,
        (select count(*)::int from seeds where mature) as seeds_mature,
        (select count(*)::int from completed a join seeds s on s.visitor_id = a.owner_id where a.first_touch_at >= s.seed_at and a.first_touch_at < s.seed_at + interval '7 days') as seed_children_observed,
        (select count(*)::int from completed a join seeds s on s.visitor_id = a.owner_id where s.mature and a.first_touch_at >= s.seed_at and a.first_touch_at < s.seed_at + interval '7 days') as seed_children_mature,
        (select count(*)::int from paying_cohort) as attributed_completed_observed,
        (select count(*)::int from paying_cohort where mature) as attributed_completed_mature,
        (select count(*)::int from paying_cohort p where p.mature and exists(select 1 from orders o where o.visitor_id = p.visitor_id and o.provider <> 'mock' and o.status = 'paid' and o.paid_at >= p.completed_at and o.paid_at < p.completed_at + interval '7 days')) as real_payers_mature,
        (select count(*)::int from paying_cohort p where exists(select 1 from orders o where o.visitor_id = p.visitor_id and o.provider <> 'mock' and o.status = 'paid' and o.paid_at >= p.completed_at and o.paid_at < p.completed_at + interval '7 days')) as real_payers_observed,
        (select count(*)::int from paying_cohort p where exists(select 1 from result_shares s where s.visitor_id = p.visitor_id and s.created_at >= p.completed_at and s.created_at < p.completed_at + interval '7 days')) as new_customer_creators_observed,
        (select count(distinct child.visitor_id)::int from completed child join completed parent on parent.visitor_id = child.owner_id cross join bounds b where parent.completed_at >= b.lo and parent.completed_at < b.hi and child.first_touch_at >= parent.completed_at and child.first_touch_at < parent.completed_at + interval '7 days' and child.visitor_id <> parent.owner_id) as next_generation_completed_observed,
        (select count(distinct child.visitor_id)::int from completed child join completed parent on parent.visitor_id = child.owner_id cross join bounds b where parent.completed_at >= b.lo and parent.completed_at < b.hi and parent.completed_at + interval '14 days' <= b.observed and child.first_touch_at >= parent.completed_at and child.first_touch_at < parent.completed_at + interval '7 days' and child.visitor_id <> parent.owner_id) as next_generation_completed_mature,
        (select coalesce(jsonb_agg(to_jsonb(revenue)), '[]'::jsonb) from revenue) as revenue_by_currency_status
      `;
    });
    const r = rows[0];
    const ratio = (numerator: number, denominator: number, days: number, observedNumerator: number, observedDenominator: number, scale = 1) => ({
      numerator, denominator, value: denominator ? numerator / denominator * scale : null,
      scale, observation_days: days, status: observedDenominator === denominator ? "mature" : "observing",
      observed_numerator: observedNumerator, observed_denominator: observedDenominator,
      observing_users: observedDenominator - denominator,
      rate_basis: "mature users only", definition_version: "first-touch-v1",
    });
    const output = {
      definition_version: "first-touch-v1", period_start: start.toISOString(), period_end_exclusive: end.toISOString(), observed_at: now.toISOString(),
      first_completion_card_creation_7d: ratio(r.base_creators_mature, r.base_mature, 7, r.base_creators_observed, r.base_users),
      old_customer_creators: r.old_creators, shares_created: r.shares_created,
      valid_share_visitors: { count: r.visible_visitors, basis: "signed browser visitors deduplicated across cards; owners excluded; foreground events only" },
      first_touch_completion_7d: ratio(r.touch_completed_mature, r.touches_mature, 7, r.touch_completed_observed, r.touches_observed),
      first_completion_referral_7d: ratio(r.first_completion_children_mature, r.base_mature, 7, r.first_completion_children_observed, r.base_users, 100),
      share_seed_referral_14d: ratio(r.seed_children_mature, r.seeds_mature, 14, r.seed_children_observed, r.seeds_observed, 100),
      next_generation: { new_customer_creators_observed: r.new_customer_creators_observed, completed_observed: r.next_generation_completed_observed, completed_mature: r.next_generation_completed_mature, observation_days: 14, basis: "parents first completed in period; child first touch within 7 days, completion within its 7-day attribution; self loops excluded; observed counts provisional" },
      real_payment_7d: ratio(r.real_payers_mature, r.attributed_completed_mature, 7, r.real_payers_observed, r.attributed_completed_observed),
      revenue: { cohorts: "mature attributed first completions in period, payment within 7 days", amount_unit: "currency minor units (CNY fen / USD cents)", currencies_and_statuses: r.revenue_by_currency_status, note: "paid and refunded orders shown separately; refunded totals are order face values, not a refund ledger" },
      limitations: ["First-touch association, not causal uplift or natural-person identity.", "Missing or failed foreground attribution is unknown and is not backfilled.", "Attribution rows may be replaced after an unconverted window expires; old-window visitors are not recoverable from current rows, so conversion is conditional on retained windows.", "Events retained 90 days, attribution detail 180 days; queries older than 90 days are rejected. This check cannot establish historical collection uptime.", "Real payment excludes mock orders; amounts never combine currencies."],
    };
    if (format === "json") console.log(JSON.stringify(output, null, 2));
    else {
      const escape = (value: unknown) => `"${String(typeof value === "object" ? JSON.stringify(value) : value).replaceAll('"', '""')}"`;
      console.log("metric,value");
      for (const [key, value] of Object.entries(output)) console.log(`${escape(key)},${escape(value)}`);
    }
  } finally { await sql.end({ timeout: 5 }); }
}
main().catch((error: unknown) => {
  // Never print database errors, query parameters or connection credentials.
  console.error(error instanceof Error && !('severity' in error) ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]") : "Report query failed; verify schema, access and connection without logging credentials.");
  process.exitCode = 1;
});
