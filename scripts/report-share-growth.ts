/**
 * Aggregate first-party association report. No visitor IDs, result IDs, tokens or orders leave SQL.
 * SHARE_GROWTH_DATABASE_URL=... npx tsx scripts/report-share-growth.ts --start YYYY-MM-DD --end YYYY-MM-DD [--format csv]
 * UTC [start,end); end is also the observation cutoff. No .env or application singleton is loaded.
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
function ratio(numerator: number, denominator: number, observedNumerator: number, observedDenominator: number, days: number) {
  return { numerator, denominator, value: denominator ? numerator / denominator : null,
    observed_numerator: observedNumerator, observed_denominator: observedDenominator,
    observing_count: observedDenominator - denominator, window_days: days, basis: "mature cohorts only" };
}
async function main() {
  if (args.includes("--help")) {
    console.log("Set SHARE_GROWTH_DATABASE_URL explicitly. --start YYYY-MM-DD --end YYYY-MM-DD [--format json|csv]. UTC [start,end); end is the observation cutoff. Read-only, aggregate-only. Requires 90-day event / 180-day attribution retention; earlier first-exposure history may be unavailable.");
    return;
  }
  for (let i = 0; i < args.length; i += 2) {
    if (!["--start", "--end", "--format"].includes(args[i]) || !args[i + 1]) throw new Error("Unknown or missing argument; use --help");
  }
  const start = dateOption("--start"), end = dateOption("--end"), now = new Date();
  const format = option("--format") ?? "json";
  if (!["json", "csv"].includes(format)) throw new Error("--format must be json or csv");
  if (+end <= +start || +end > +now) throw new Error("Require start < end <= current time");
  if (+start < +now - 90 * DAY) throw new Error("DATA_INCOMPLETE: requested period exceeds 90-day event retention; historical rates are withheld");
  const databaseUrl = process.env.SHARE_GROWTH_DATABASE_URL;
  if (!databaseUrl) throw new Error("Set SHARE_GROWTH_DATABASE_URL explicitly; DATABASE_URL is deliberately not used");
  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });
  try {
    const rows = await sql.begin("isolation level repeatable read read only", async (tx) => {
      await tx`set local statement_timeout = '30s'`;
      return tx`
      with bounds as (select ${start}::timestamptz as lo, ${end}::timestamptz as cutoff),
      sources as (
        select id, 'single_card'::text as kind, visitor_id as owner_id, created_at from result_shares
        union all
        select id, 'paid_invitation', visitor_id, created_at from comparison_invitations where access_policy = 'paid-pair-v2'
      ), source_kinds as (select unnest(array['single_card','paid_invitation']) as kind),
      attributed as (
        select a.*, s.kind, s.owner_id
        from referral_attributions a join sources s
          on (s.kind = 'single_card' and s.id = a.share_id) or (s.kind = 'paid_invitation' and s.id = a.invitation_id)
        cross join bounds b where a.visitor_id <> s.owner_id and a.first_touch_at < b.cutoff
      ), touches as (
        select a.*, a.first_touch_at + interval '7 days' <= b.cutoff as mature,
          (a.first_result_id is not null and a.completed_at >= a.first_touch_at and a.completed_at < a.expires_at
           and a.completed_at < a.first_touch_at + interval '7 days' and a.completed_at < b.cutoff) as completed
        from attributed a cross join bounds b where a.first_touch_at >= b.lo
      ), source_summary as (
        select k.kind,
          (select count(*)::int from sources s cross join bounds b where s.kind = k.kind and s.created_at >= b.lo and s.created_at < b.cutoff) as created,
          (select count(distinct e.actor_visitor_id)::int from share_events e join sources s
            on (s.kind = 'single_card' and s.id = e.share_id) or (s.kind = 'paid_invitation' and s.id = e.invitation_id)
            cross join bounds b where s.kind = k.kind and e.event_name = 'share_browser_visible'
              and e.actor_visitor_id <> s.owner_id and e.occurred_at >= b.lo and e.occurred_at < b.cutoff) as visible_visitors,
          (select count(*)::int from touches t where t.kind = k.kind) as touches_observed,
          (select count(*)::int from touches t where t.kind = k.kind and t.mature) as touches_mature,
          (select count(*)::int from touches t where t.kind = k.kind and t.completed) as completed_observed,
          (select count(*)::int from touches t where t.kind = k.kind and t.mature and t.completed) as completed_mature
        from source_kinds k
      ), first_results as (
        select visitor_id, min(created_at) as first_at from results group by visitor_id
      ), card_base as (
        select r.*, r.first_at + interval '7 days' <= b.cutoff as mature
        from first_results r cross join bounds b where r.first_at >= b.lo and r.first_at < b.cutoff
      ), card_seed_first as (
        select visitor_id, min(created_at) as seed_at from result_shares group by visitor_id
      ), card_seeds as (
        select s.*, s.seed_at + interval '14 days' <= b.cutoff as mature
        from card_seed_first s cross join bounds b where s.seed_at >= b.lo and s.seed_at < b.cutoff
      ), card_completed as (
        select a.* from attributed a cross join bounds b
        where a.kind = 'single_card' and a.completed_at >= a.first_touch_at and a.completed_at < a.expires_at
          and a.completed_at < a.first_touch_at + interval '7 days' and a.completed_at < b.cutoff
      ), card_paying as (
        select a.*, a.completed_at + interval '7 days' <= b.cutoff as mature,
          exists(select 1 from orders o where o.visitor_id = a.visitor_id and o.result_id = a.first_result_id
            and o.provider <> 'mock' and o.status = 'paid' and o.paid_at >= a.completed_at
            and o.paid_at < a.completed_at + interval '7 days' and o.paid_at < b.cutoff) as purchased
        from card_completed a cross join bounds b where a.completed_at >= b.lo
      ), card_revenue as (
        select o.currency, o.status, count(distinct o.visitor_id)::int as visitors,
          count(*)::int as orders, coalesce(sum(o.amount_fen),0)::bigint as amount_minor
        from orders o join card_paying p on p.visitor_id = o.visitor_id and p.first_result_id = o.result_id cross join bounds b
        where p.mature and o.provider <> 'mock' and o.status in ('paid','refunded')
          and o.paid_at >= p.completed_at and o.paid_at < p.completed_at + interval '7 days' and o.paid_at < b.cutoff
        group by o.currency, o.status
      ), exposure_first as (
        -- Find the first qualifying event across all retained history, before applying the report period.
        select actor_visitor_id as visitor_id, owner_result_id as result_id, eligibility_at_event as eligibility, min(occurred_at) as first_at
        from share_events cross join bounds b
        where event_name = 'pairing_benefit_viewed' and rule_version = 'paid-pair-v2'
          and eligibility_at_event in ('locked','eligible') and owner_result_id is not null and occurred_at < b.cutoff
        group by actor_visitor_id, owner_result_id, eligibility_at_event
      ), locked_cohort as (
        select e.*, e.first_at + interval '7 days' <= b.cutoff as mature,
          exists(select 1 from share_events c where c.event_name = 'pairing_checkout_opened' and c.actor_visitor_id = e.visitor_id
            and c.owner_result_id = e.result_id and c.occurred_at >= e.first_at and c.occurred_at < e.first_at + interval '7 days' and c.occurred_at < b.cutoff) as checkout,
          exists(select 1 from orders o where o.visitor_id = e.visitor_id and o.result_id = e.result_id and o.provider <> 'mock' and o.status = 'paid'
            and o.paid_at >= e.first_at and o.paid_at < e.first_at + interval '7 days' and o.paid_at < b.cutoff) as purchased
        from exposure_first e cross join bounds b where e.eligibility = 'locked' and e.first_at >= b.lo
      ), eligible_cohort as (
        select e.*, e.first_at + interval '7 days' <= b.cutoff as mature,
          exists(select 1 from comparison_invitations i where i.visitor_id = e.visitor_id and i.result_id = e.result_id and i.access_policy = 'paid-pair-v2'
            and i.created_at >= e.first_at and i.created_at < e.first_at + interval '7 days' and i.created_at < b.cutoff) as invited
        from exposure_first e cross join bounds b where e.eligibility = 'eligible' and e.first_at >= b.lo
          and not exists(select 1 from comparison_invitations i left join result_shares s on s.id = i.share_id
            where i.visitor_id = e.visitor_id and i.result_id = e.result_id and i.access_policy = 'paid-pair-v2'
              and i.created_at < e.first_at and i.expires_at > e.first_at and (i.revoked_at is null or i.revoked_at > e.first_at)
              and (i.share_id is null or (s.id is not null and (s.revoked_at is null or s.revoked_at > e.first_at))))
      ), invitation_cohort as (
        select i.*, i.created_at + interval '14 days' <= b.cutoff as mature,
          exists(select 1 from comparisons p where p.invitation_id = i.id and p.access_policy = 'paid-pair-v2'
            and p.created_at >= i.created_at and p.created_at < i.created_at + interval '14 days' and p.created_at < b.cutoff) as completed,
          exists(select 1 from comparisons p where p.invitation_id = i.id and p.access_policy = 'paid-pair-v2'
            and p.created_at >= i.created_at + interval '14 days' and p.created_at < b.cutoff) as completed_late,
          exists(select 1 from share_events e where e.invitation_id = i.id and e.event_name = 'share_browser_visible' and e.actor_visitor_id <> i.visitor_id
            and e.occurred_at >= i.created_at and e.occurred_at < i.created_at + interval '14 days' and e.occurred_at < b.cutoff) as touched,
          exists(select 1 from share_events e where e.invitation_id = i.id and e.event_name = 'pairing_result_selected' and e.actor_visitor_id <> i.visitor_id
            and e.occurred_at >= i.created_at and e.occurred_at < i.created_at + interval '14 days' and e.occurred_at < b.cutoff) as selected
        from comparison_invitations i cross join bounds b where i.access_policy = 'paid-pair-v2' and i.created_at >= b.lo and i.created_at < b.cutoff
      ), selected_cohort as (
        select e.*, e.occurred_at + interval '7 days' <= b.cutoff as mature,
          exists(select 1 from orders o where o.visitor_id = e.actor_visitor_id and o.result_id = e.owner_result_id and o.provider <> 'mock' and o.status = 'paid'
            and o.paid_at >= e.occurred_at and o.paid_at < e.occurred_at + interval '7 days' and o.paid_at < b.cutoff) as purchased
        from share_events e cross join bounds b where e.event_name = 'pairing_result_selected' and e.rule_version = 'paid-pair-v2'
          and e.occurred_at >= b.lo and e.occurred_at < b.cutoff
      ), pair_cohort as (
        select p.*, p.created_at + interval '7 days' <= b.cutoff as mature,
          (select count(distinct e.actor_visitor_id) = 2 from share_events e where e.pair_id = p.id and e.event_name = 'comparison_viewed'
            and e.actor_visitor_id in (p.host_visitor_id,p.guest_visitor_id) and e.occurred_at >= p.created_at
            and e.occurred_at < p.created_at + interval '7 days' and e.occurred_at < b.cutoff) as both_read,
          (select count(distinct e.actor_visitor_id) = 2 from share_events e where e.pair_id = p.id and e.event_name = 'comparison_viewed'
            and e.actor_visitor_id in (p.host_visitor_id,p.guest_visitor_id) and e.occurred_at >= p.created_at and e.occurred_at < b.cutoff) as both_read_observed
        from comparisons p cross join bounds b where p.created_at >= b.lo and p.created_at < b.cutoff
      ), revenue as (
        select o.currency, o.status, count(*)::int as orders, coalesce(sum(o.amount_fen),0)::bigint as amount_minor
        from orders o cross join bounds b
        where o.provider <> 'mock' and o.status in ('paid','refunded') and o.paid_at < b.cutoff
          and exists(select 1 from locked_cohort e where e.mature and e.visitor_id = o.visitor_id and e.result_id = o.result_id
            and o.paid_at >= e.first_at and o.paid_at < e.first_at + interval '7 days')
        group by o.currency, o.status
      ), pair_summary as (
        select access_policy, count(*)::int as created, count(*) filter(where mature)::int as mature,
          count(*) filter(where both_read)::int as both_read_observed,
          count(*) filter(where mature and both_read)::int as both_read_mature,
          count(*) filter(where not both_read and both_read_observed)::int as both_read_only_after_window
        from pair_cohort group by access_policy
      )
      select
        (select count(*)::int from card_base) as card_base_observed,
        (select count(*)::int from card_base where mature) as card_base_mature,
        (select count(*)::int from card_base r cross join bounds b where exists(select 1 from result_shares s where s.visitor_id = r.visitor_id
          and s.created_at >= r.first_at and s.created_at < r.first_at + interval '7 days' and s.created_at < b.cutoff)) as card_creators_observed,
        (select count(*)::int from card_base r cross join bounds b where r.mature and exists(select 1 from result_shares s where s.visitor_id = r.visitor_id
          and s.created_at >= r.first_at and s.created_at < r.first_at + interval '7 days' and s.created_at < b.cutoff)) as card_creators_mature,
        (select count(distinct s.visitor_id)::int from result_shares s join first_results r on r.visitor_id = s.visitor_id cross join bounds b
          where s.created_at >= b.lo and s.created_at < b.cutoff and r.first_at < b.lo) as card_old_creators,
        (select count(*)::int from card_completed a join card_base r on r.visitor_id = a.owner_id
          where a.completed_at >= r.first_at and a.completed_at < r.first_at + interval '7 days') as card_children_observed,
        (select count(*)::int from card_completed a join card_base r on r.visitor_id = a.owner_id
          where r.mature and a.completed_at >= r.first_at and a.completed_at < r.first_at + interval '7 days') as card_children_mature,
        (select count(*)::int from card_seeds) as card_seeds_observed,
        (select count(*)::int from card_seeds where mature) as card_seeds_mature,
        (select count(*)::int from card_completed a join card_seeds s on s.visitor_id = a.owner_id
          where a.first_touch_at >= s.seed_at and a.first_touch_at < s.seed_at + interval '7 days'
            and a.completed_at < s.seed_at + interval '14 days') as card_seed_children_observed,
        (select count(*)::int from card_completed a join card_seeds s on s.visitor_id = a.owner_id
          where s.mature and a.first_touch_at >= s.seed_at and a.first_touch_at < s.seed_at + interval '7 days'
            and a.completed_at < s.seed_at + interval '14 days') as card_seed_children_mature,
        (select count(*)::int from card_paying) as card_paying_observed,
        (select count(*)::int from card_paying where mature) as card_paying_mature,
        (select count(*)::int from card_paying where purchased) as card_purchased_observed,
        (select count(*)::int from card_paying where mature and purchased) as card_purchased_mature,
        (select count(*)::int from card_paying p cross join bounds b where exists(select 1 from result_shares s where s.visitor_id = p.visitor_id
          and s.created_at >= p.completed_at and s.created_at < p.completed_at + interval '7 days' and s.created_at < b.cutoff)) as card_new_creators,
        (select count(distinct child.visitor_id)::int from card_completed child join card_completed parent on parent.visitor_id = child.owner_id cross join bounds b
          where parent.completed_at >= b.lo and child.first_touch_at >= parent.completed_at
            and child.first_touch_at < parent.completed_at + interval '7 days' and child.visitor_id <> parent.owner_id) as card_next_observed,
        (select count(distinct child.visitor_id)::int from card_completed child join card_completed parent on parent.visitor_id = child.owner_id cross join bounds b
          where parent.completed_at >= b.lo and parent.completed_at + interval '14 days' <= b.cutoff and child.first_touch_at >= parent.completed_at
            and child.first_touch_at < parent.completed_at + interval '7 days' and child.visitor_id <> parent.owner_id) as card_next_mature,
        (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from card_revenue c) as card_revenue,
        (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from source_summary s) as sources,
        (select count(*)::int from locked_cohort) as locked_observed,
        (select count(*)::int from locked_cohort where mature) as locked_mature,
        (select count(*)::int from locked_cohort where checkout) as checkout_observed,
        (select count(*)::int from locked_cohort where mature and checkout) as checkout_mature,
        (select count(*)::int from locked_cohort where purchased) as purchased_observed,
        (select count(*)::int from locked_cohort where mature and purchased) as purchased_mature,
        (select count(*)::int from eligible_cohort) as eligible_observed,
        (select count(*)::int from eligible_cohort where mature) as eligible_mature,
        (select count(*)::int from eligible_cohort where invited) as invited_observed,
        (select count(*)::int from eligible_cohort where mature and invited) as invited_mature,
        (select count(*)::int from invitation_cohort) as invitations_observed,
        (select count(*)::int from invitation_cohort where mature) as invitations_mature,
        (select count(*)::int from invitation_cohort where completed) as completed_observed,
        (select count(*)::int from invitation_cohort where mature and completed) as completed_mature,
        (select count(*)::int from invitation_cohort where completed_late) as completed_after_14d,
        (select count(*)::int from invitation_cohort where touched) as touched_invitations,
        (select count(*)::int from invitation_cohort where selected) as selected_invitations,
        (select count(*)::int from invitation_cohort where touched and not selected) as touched_without_selection,
        (select count(*)::int from selected_cohort) as selected_results,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'eligible') as selected_already_eligible,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'locked') as selected_locked,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'locked' and mature) as selected_locked_mature,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'locked' and purchased) as selected_purchased,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'locked' and mature and purchased) as selected_purchased_mature,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'unavailable') as selected_unavailable,
        (select count(*)::int from selected_cohort where eligibility_at_event = 'syncing') as selected_syncing,
        (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from pair_summary p) as pairs,
        (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from revenue r) as revenue
      `;
    });
    const r = rows[0];
    type SourceRow = { kind: string; created: number; visible_visitors: number; touches_observed: number; touches_mature: number; completed_observed: number; completed_mature: number };
    type PairRow = { access_policy: string; created: number; mature: number; both_read_observed: number; both_read_mature: number; both_read_only_after_window: number };
    const cardSource = (r.sources as SourceRow[]).find(source => source.kind === "single_card")!;
    const cardRate = (numerator: number, denominator: number, observedNumerator: number, observedDenominator: number, days: number, scale = 1) => {
      const result = ratio(numerator, denominator, observedNumerator, observedDenominator, days);
      return { ...result, value: result.value === null ? null : result.value * scale, scale, source: "single_card" };
    };
    const output = {
      definition_version: "paid-pair-v2", period_start: start.toISOString(), period_end_exclusive: end.toISOString(), observation_cutoff: end.toISOString(), generated_at: now.toISOString(),
      // Existing P0 keys remain available; the v2 report now fixes every observation at the requested cutoff.
      first_completion_card_creation_7d: cardRate(r.card_creators_mature, r.card_base_mature, r.card_creators_observed, r.card_base_observed, 7),
      old_customer_creators: r.card_old_creators, shares_created: cardSource.created,
      valid_share_visitors: { count: cardSource.visible_visitors, basis: "signed browsers; P0 cards only; owners excluded; foreground events" },
      first_touch_completion_7d: cardRate(cardSource.completed_mature, cardSource.touches_mature, cardSource.completed_observed, cardSource.touches_observed, 7),
      first_completion_referral_7d: cardRate(r.card_children_mature, r.card_base_mature, r.card_children_observed, r.card_base_observed, 7, 100),
      share_seed_referral_14d: cardRate(r.card_seed_children_mature, r.card_seeds_mature, r.card_seed_children_observed, r.card_seeds_observed, 14, 100),
      real_payment_7d: cardRate(r.card_purchased_mature, r.card_paying_mature, r.card_purchased_observed, r.card_paying_observed, 7),
      next_generation: { new_customer_creators_observed: r.card_new_creators, completed_observed: r.card_next_observed,
        completed_mature: r.card_next_mature, observation_days: 14, source: "single_card", basis: "parent completion in period; child touch within 7d, own first completion within 7d; self loops excluded" },
      revenue: { basis: "mature P0-attributed first completions; same visitor and first result; payment in [completion,+7d)",
        amount_unit: "currency minor units (CNY fen / USD cents)", currencies_and_statuses: r.card_revenue,
        note: "Mock excluded. Currencies never combined. Paid and refunded face values are separate, not a refund ledger." },
      sources: (r.sources as SourceRow[]).map(s => ({ kind: s.kind, created: s.created, visible_visitors: s.visible_visitors,
        first_touch_completion_7d: ratio(s.completed_mature, s.touches_mature, s.completed_observed, s.touches_observed, 7) })),
      purchase_funnel: { unit: "visitor/result; first retained locked benefit exposure", exposed_results: r.locked_observed,
        checkout_opened_7d: ratio(r.checkout_mature, r.locked_mature, r.checkout_observed, r.locked_observed, 7),
        real_purchase_7d: ratio(r.purchased_mature, r.locked_mature, r.purchased_observed, r.locked_observed, 7) },
      invitation_start_7d: { ...ratio(r.invited_mature, r.eligible_mature, r.invited_observed, r.eligible_observed, 7),
        unit: "visitor/result; first retained eligible exposure; no previously active paid invitation" },
      paid_invitation_funnel: { created: r.invitations_observed, visibly_touched_within_14d: r.touched_invitations, result_selected_within_14d: r.selected_invitations,
        touched_without_selection_within_14d: r.touched_without_selection,
        completed_14d: ratio(r.completed_mature, r.invitations_mature, r.completed_observed, r.invitations_observed, 14),
        invitations_with_generation_after_14d: r.completed_after_14d,
        note: "Not selecting a result after a visible visit is observed drop-off, not evidence that a visitor refused payment." },
      invited_result_selection: { selected: r.selected_results, already_eligible: r.selected_already_eligible, locked: r.selected_locked,
        unavailable: r.selected_unavailable, syncing: r.selected_syncing,
        locked_real_purchase_7d: ratio(r.selected_purchased_mature, r.selected_locked_mature, r.selected_purchased, r.selected_locked, 7),
        unit: "visitor/invitation/result; retained selection events, independent of continuation cleanup" },
      comparisons: (r.pairs as PairRow[]).map(p => ({ access_policy: p.access_policy, created: p.created,
        both_read_7d: ratio(p.both_read_mature, p.mature, p.both_read_observed, p.created, 7), both_read_only_after_7d: p.both_read_only_after_window })),
      pairing_revenue: { basis: "mature locked benefit-exposure cohorts; same visitor and result; payment in [first exposure,+7d)",
        amount_unit: "currency minor units (CNY fen / USD cents)", currencies_and_statuses: r.revenue,
        note: "Mock excluded. Currencies never combined. Paid and refunded order face values are separate; this is not a refund ledger." },
      limitations: ["First-touch and exposure association, not causal uplift or natural-person identity.",
        "Missing or failed visible events are unknown and are not backfilled. Analytics failure never blocks valid quiz submission.",
        "Attribution has one mutually exclusive card/invitation source. Expired unconverted windows may be replaced; historical windows cannot be reconstructed.",
        "Events are retained 90 days and attribution details 180 days. First-exposure/selection history that predates retention is unknown; retained-history rates are not lifetime rates.",
        "Old invitation traffic previously stored as card traffic cannot be separated retroactively. Legacy and paid policies are not a before/after causal experiment.",
        "The report cutoff is end (exclusive). Immature cohorts remain separate; generation after 14 days and joint reading after 7 days never enter mature numerators.",
        "Payment statuses reflect database state when queried; this report cannot reconstruct historical refunds or collection outages.",
        "Copies and image requests are intents, not proof that a message was delivered or read."],
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
  console.error(error instanceof Error && !('severity' in error) ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]") : "Report query failed; verify schema, access and connection without logging credentials.");
  process.exitCode = 1;
});
