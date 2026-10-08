import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { filters, time, visitorLabel, type Search } from "@/lib/filters";
import { visitorList } from "@/lib/data";
import { Heading, FilterForm, Pager } from "@/components/dashboard";
export default async function Visitors({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin(); const search = await searchParams; const f = filters(search); const data = await visitorList(f);
  return <><Heading title="匿名访客">期间浏览或完成测试的浏览器。测试与订单列为该浏览器累计记录。</Heading><FilterForm f={f} /><section className="panel"><div className="table-scroll"><table><caption>访客记录</caption><thead><tr><th>访客</th><th>首次记录</th><th>最近访问</th><th>期间浏览</th><th>累计测试 / 已开放</th><th>累计订单 / 实付</th></tr></thead><tbody>{data.rows.map(v => <tr key={v.id}><td><Link href={`/visitors/${v.id}`}>{visitorLabel(v.id)} →</Link></td><td>{time(v.created_at)}</td><td>{time(v.last_seen_at)}</td><td>{v.views}</td><td>{v.results} / {v.unlocked}</td><td>{v.orders} / {v.paid}</td></tr>)}</tbody></table>{!data.rows.length && <p className="empty">这个范围内没有访客记录。</p>}</div><Pager path="/visitors" search={search} page={f.page} total={data.total} /></section></>;
}
