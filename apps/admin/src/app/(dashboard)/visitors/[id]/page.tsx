import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { filters, time, visitorLabel, type Search } from "@/lib/filters";
import { visitorList, traffic } from "@/lib/data";
import { Heading, FilterForm, Metric, VisitTable, Pager } from "@/components/dashboard";
export default async function Visitor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  await requireAdmin(); const { id } = await params; if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) notFound();
  const search = await searchParams; const f = filters(search); const data = await visitorList(f, id); const v = data.rows[0]; if (!v) notFound(); const visits = await traffic(f, id);
  return <><Heading title={visitorLabel(id)}>首次记录 {time(v.created_at)} · 最近访问 {time(v.last_seen_at)}</Heading><Link href="/visitors">← 返回访客列表</Link><div className="metrics"><Metric label="累计完成测试" value={v.results} note="不展示作答或性格结果" /><Metric label="累计已开放报告" value={v.unlocked} note="含请 TA 打开的报告" /><Metric label="累计订单" value={v.orders} note="所有支付尝试" /><Metric label="累计实付订单" value={v.paid} note="当前已支付，排除模拟" /></div><FilterForm f={f} /><section className="panel"><VisitTable rows={visits.recent} /><Pager path={`/visitors/${id}`} search={search} page={f.page} total={visits.total} /></section></>;
}
