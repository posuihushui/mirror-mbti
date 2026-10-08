import "server-only";
import { readOnly } from "./db";
import type { Filters } from "./filters";

export type Revenue = { currency: string; kind: string; count: number; amount: number };
export type Trend = { day: string; views: number; visitors: number };
export type Order = { id: string; visitor_id: string; amount_fen: number; currency: string; provider: string; channel: string; status: string; kind: string; pricing: string; created_at: Date; paid_at: Date | null; locale: string };
export type Visit = { id: string; visitor_id: string; path: string; locale: string; device: string; referrer_host: string | null; created_at: Date };
export type Visitor = { id: string; created_at: Date; last_seen_at: Date; results: number; unlocked: number; orders: number; paid: number; views: number };
export async function overview(f: Filters) {
  return readOnly(async (sql) => {
    const [totals] = await sql<{ views: number; visitors: number; completions: number; orders: number; mock: number }[]>`
      select (select count(*)::int from browser_events where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale})) as views,
      (select count(distinct visitor_id)::int from browser_events where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale})) as visitors,
      (select count(*)::int from results where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or (case when questionnaire_id like 'en%' then 'en' else 'zh' end) = ${f.locale})) as completions,
      (select count(*)::int from orders where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or currency = case when ${f.locale} = 'en' then 'USD' else 'CNY' end)) as orders,
      (select count(*)::int from orders where created_at >= ${f.start} and created_at < ${f.end} and provider = 'mock' and (${f.locale} = '' or currency = case when ${f.locale} = 'en' then 'USD' else 'CNY' end)) as mock`;
    const revenue = await sql<Revenue[]>`select currency, kind, count(*)::int as count, coalesce(sum(amount_fen), 0)::bigint as amount from orders
      where status = 'paid' and provider <> 'mock' and paid_at >= ${f.start} and paid_at < ${f.end}
      and (${f.locale} = '' or currency = case when ${f.locale} = 'en' then 'USD' else 'CNY' end) group by currency, kind order by currency, kind`;
    const trend = await sql<Trend[]>`select to_char(d, 'MM-DD') as day, coalesce(v.views, 0)::int as views, coalesce(v.visitors, 0)::int as visitors
      from generate_series(${f.start}::timestamptz at time zone 'Asia/Shanghai', (${f.end}::timestamptz at time zone 'Asia/Shanghai') - interval '1 day', interval '1 day') d
      left join (select (created_at at time zone 'Asia/Shanghai')::date as date, count(*) as views, count(distinct visitor_id) as visitors from browser_events
      where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale}) group by 1) v on v.date = d::date order by d`;
    return { totals, revenue, trend };
  });
}
export async function orderList(f: Filters) {
  return readOnly(async (sql) => {
    // An exact order number is accepted for support, but remains masked in output.
    const rows = await sql<(Order & { total: number })[]>`select o.id, o.visitor_id, o.amount_fen, o.currency, o.provider, o.channel, o.status, o.kind, o.pricing, o.created_at, o.paid_at,
      case when r.questionnaire_id like 'en%' then 'en' else 'zh' end as locale, count(*) over()::int as total
      from orders o join results r on r.id = o.result_id where o.created_at >= ${f.start} and o.created_at < ${f.end}
      and (${f.status} = '' or o.status::text = ${f.status}) and (${f.provider} = '' or o.provider::text = ${f.provider})
      and (${f.kind} = '' or o.kind = ${f.kind}) and (${f.locale} = '' or (case when r.questionnaire_id like 'en%' then 'en' else 'zh' end) = ${f.locale})
      and (${f.query} = '' or o.id = ${f.query}) order by o.created_at desc, o.id desc limit 50 offset ${(f.page - 1) * 50}`;
    return { rows, total: rows[0]?.total ?? 0 };
  });
}
export async function traffic(f: Filters, visitor?: string) {
  return readOnly(async (sql) => {
    const pages = await sql<{ path: string; views: number; visitors: number }[]>`select path, count(*)::int as views, count(distinct visitor_id)::int as visitors from browser_events
      where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale}) group by path order by views desc, path limit 20`;
    const sources = await sql<{ source: string; views: number }[]>`select coalesce(referrer_host, '直接访问 / 无来源') as source, count(*)::int as views from browser_events
      where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale}) group by 1 order by views desc limit 10`;
    const devices = await sql<{ device: string; views: number }[]>`select device, count(*)::int as views from browser_events
      where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale}) group by 1 order by views desc`;
    const recent = await sql<(Visit & { total: number })[]>`select id, visitor_id, path, locale, device, referrer_host, created_at, count(*) over()::int as total from browser_events
      where created_at >= ${f.start} and created_at < ${f.end} and (${f.locale} = '' or locale = ${f.locale})
      and (${visitor ?? ""} = '' or visitor_id::text = ${visitor ?? ""}) order by created_at desc, id desc limit 50 offset ${(f.page - 1) * 50}`;
    return { pages, sources, devices, recent, total: recent[0]?.total ?? 0 };
  });
}
export async function visitorList(f: Filters, id?: string) {
  return readOnly(async (sql) => {
    const rows = await sql<(Visitor & { total: number })[]>`select v.id, v.created_at, v.last_seen_at, count(*) over()::int as total,
      (select count(*)::int from results r where r.visitor_id = v.id) as results,
      (select count(*)::int from results r where r.visitor_id = v.id and r.unlocked_at is not null) as unlocked,
      (select count(*)::int from orders o where o.visitor_id = v.id) as orders,
      (select count(*)::int from orders o where o.visitor_id = v.id and o.status = 'paid' and o.provider <> 'mock') as paid,
      (select count(*)::int from browser_events b where b.visitor_id = v.id and b.created_at >= ${f.start} and b.created_at < ${f.end} and (${f.locale} = '' or b.locale = ${f.locale})) as views
      from visitors v where (${id ?? ""} <> '' and v.id::text = ${id ?? ""}) or (${id ?? ""} = '' and exists (
        select 1 from browser_events b where b.visitor_id = v.id and b.created_at >= ${f.start} and b.created_at < ${f.end} and (${f.locale} = '' or b.locale = ${f.locale})
        union all select 1 from results r where r.visitor_id = v.id and r.created_at >= ${f.start} and r.created_at < ${f.end} and (${f.locale} = '' or (case when r.questionnaire_id like 'en%' then 'en' else 'zh' end) = ${f.locale})
      )) order by v.last_seen_at desc, v.id limit 50 offset ${id ? 0 : (f.page - 1) * 50}`;
    return { rows, total: rows[0]?.total ?? 0 };
  });
}
