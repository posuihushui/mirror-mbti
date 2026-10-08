import Link from "next/link";
import type { ReactNode } from "react";
import { pageHref, statuses, providers, statusLabels, kindLabels, pricingLabels, money, maskOrder, time, visitorLabel, type Filters, type Search } from "@/lib/filters";
import type { Order, Visit, Trend } from "@/lib/data";
export function Heading({ title, children }: { title: string; children: ReactNode }) { return <div className="page-head"><div><h1>{title}</h1><p>{children}</p></div></div>; }
export function FilterForm({ f, orders = false }: { f: Filters; orders?: boolean }) {
  return <form className="filters"><label>开始日期<input type="date" name="start" defaultValue={f.startDate} required /></label><label>结束日期<input type="date" name="end" defaultValue={f.endDate} required /></label>
    <label>语言<select name="locale" defaultValue={f.locale}><option value="">全部语言</option><option value="zh">中文</option><option value="en">英文</option></select></label>
    {orders && <><label>状态<select name="status" defaultValue={f.status}><option value="">全部状态</option>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label><label>渠道<select name="provider" defaultValue={f.provider}><option value="">全部渠道</option>{providers.map(p => <option key={p}>{p}</option>)}</select></label><label>商品<select name="kind" defaultValue={f.kind}><option value="">全部商品</option><option value="report">完整报告</option><option value="pair-gift">请 TA</option></select></label><label>精确订单号<input name="q" defaultValue={f.query} maxLength={80} autoComplete="off" placeholder="输入完整订单号" /></label></>}
    <button className="pill">查看 →</button></form>;
}
export function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <article className="metric"><p>{label}</p><strong className="number">{value}</strong><small>{note}</small></article>; }
export function Pager({ path, search, page, total }: { path: string; search: Search; page: number; total: number }) {
  return <div className="pagination"><span>{total} 条 · 第 {page} 页</span><div>{page > 1 && <Link href={pageHref(path, search, page - 1)}>← 上一页</Link>}{page * 50 < total && <Link href={pageHref(path, search, page + 1)}>下一页 →</Link>}</div></div>;
}
export function OrderTable({ rows }: { rows: Order[] }) {
  return <div className="table-scroll"><table><caption>订单明细</caption><thead><tr><th>订单 / 创建时间</th><th>商品</th><th>金额</th><th>状态</th><th>支付渠道</th><th>访客</th><th>支付时间</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="number">{maskOrder(row.id)}<br /><span className="small muted">{time(row.created_at)}</span></td><td>{kindLabels[row.kind] ?? row.kind}<br /><span className="small muted">{pricingLabels[row.pricing] ?? row.pricing} · {row.locale === "zh" ? "中文" : "英文"}</span></td><td className="number">{money(row.amount_fen, row.currency)}</td><td><span className={`status status-${row.status}`}>{statusLabels[row.status] ?? row.status}</span></td><td>{row.provider}<br /><span className="small muted">{row.channel}</span></td><td><Link href={`/visitors/${row.visitor_id}`}>{visitorLabel(row.visitor_id)} →</Link></td><td className="number">{time(row.paid_at)}</td></tr>)}</tbody></table>{!rows.length && <p className="empty">这个范围内没有订单。</p>}</div>;
}
const devices: Record<string,string> = { phone: "手机", tablet: "平板", desktop: "电脑" };
export function VisitTable({ rows }: { rows: Visit[] }) { return <div className="table-scroll"><table><caption>最近浏览</caption><thead><tr><th>时间</th><th>访客</th><th>页面</th><th>设备</th><th>来源域名</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="number">{time(row.created_at)}</td><td><Link href={`/visitors/${row.visitor_id}`}>{visitorLabel(row.visitor_id)} →</Link></td><td>{row.path}</td><td>{devices[row.device] ?? row.device}</td><td>{row.referrer_host ?? "直接访问 / 无来源"}</td></tr>)}</tbody></table>{!rows.length && <p className="empty">还没有浏览记录。完成迁移后，新访问会逐步出现在这里。</p>}</div>; }
export function TrendChart({ rows }: { rows: Trend[] }) {
  const max = Math.max(1, ...rows.map(r => r.views));
  return <section className="panel"><h2>每日浏览趋势</h2><p>北京时间 · 页面浏览次数</p><ul className="bar-list">{rows.map(r => <li key={r.day}><span>{r.day}</span><div className="bar-track"><div className="bar" style={{ width: `${r.views / max * 100}%` }} /></div><span className="number">{r.views} 次</span></li>)}</ul></section>;
}
