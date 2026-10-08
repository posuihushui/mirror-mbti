import { requireAdmin } from "@/lib/auth";
import { filters, money, type Search } from "@/lib/filters";
import { overview } from "@/lib/data";
import { Heading, FilterForm, Metric, TrendChart } from "@/components/dashboard";
export default async function Overview({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const f = filters(await searchParams); const data = await overview(f);
  return <><Heading title="经营概览">从访问到测试，再到订单。最近 7 天 · 可查询最多 90 天。</Heading><FilterForm f={f} />
    <div className="metrics"><Metric label="页面浏览" value={data.totals.views} note="站内浏览记录 PV" /><Metric label="浏览访客" value={data.totals.visitors} note="签名浏览器去重 UV" /><Metric label="完成测试" value={data.totals.completions} note="期间提交的测试记录" /><Metric label="新建订单" value={data.totals.orders} note={`含 ${data.totals.mock} 笔模拟订单`} /></div>
    <div className="grid-2"><TrendChart rows={data.trend} /><section className="panel"><h2>已支付金额</h2><p>按支付时间统计，排除模拟和已退款订单；不是结算净额。</p><div className="revenue">{["CNY", "USD"].map(currency => <div key={currency}><h3>{currency}</h3>{["report", "pair-gift"].map(kind => { const row = data.revenue.find(r => r.currency === currency && r.kind === kind); return <p key={kind}><span className="muted">{kind === "report" ? "完整报告" : "请 TA"}</span><br /><strong className="number">{money(Number(row?.amount ?? 0), currency)}</strong><br /><span className="small muted">{row?.count ?? 0} 笔</span></p>; })}</div>)}</div></section></div>
    <p className="small muted">访客标识代表浏览器，不代表真实人数；完成测试与订单是独立计数，不作为同一批用户的转化率。浏览记录从上线采集开始，保留 90 天。</p></>;
}
