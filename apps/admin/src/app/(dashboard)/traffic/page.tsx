import { requireAdmin } from "@/lib/auth";
import { filters, type Search } from "@/lib/filters";
import { traffic } from "@/lib/data";
import { Heading, FilterForm, VisitTable, Pager } from "@/components/dashboard";
export default async function Traffic({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin(); const search = await searchParams; const f = filters(search); const data = await traffic(f);
  return <><Heading title="浏览情况">查看热门页面、来源域名、设备和最近浏览。私人链接只显示路径模板。</Heading><FilterForm f={f} />
    <div className="grid-2"><section className="panel"><div className="table-scroll"><table><caption>热门页面</caption><thead><tr><th>页面</th><th>浏览 PV</th><th>访客 UV</th></tr></thead><tbody>{data.pages.map(row => <tr key={row.path}><td>{row.path}</td><td>{row.views}</td><td>{row.visitors}</td></tr>)}</tbody></table>{!data.pages.length && <p className="empty">暂无浏览数据。</p>}</div></section><section className="panel"><h2>设备与来源</h2><p>{data.devices.map(row => `${({ phone: "手机", tablet: "平板", desktop: "电脑" } as Record<string,string>)[row.device] ?? row.device} ${row.views} 次`).join(" · ") || "暂无设备数据"}</p><table><thead><tr><th>来源域名</th><th>浏览次数</th></tr></thead><tbody>{data.sources.map(row => <tr key={row.source}><td>{row.source}</td><td>{row.views}</td></tr>)}</tbody></table></section></div>
    <section className="panel"><VisitTable rows={data.recent} /><Pager path="/traffic" search={search} page={f.page} total={data.total} /></section></>;
}
