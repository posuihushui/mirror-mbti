export type Search = Record<string, string | string[] | undefined>;
export const statuses = ["created", "paid", "cancelled", "failed", "expired", "refunded"] as const;
export const providers = ["wechat", "waffo", "crypto", "mock"] as const;
export const statusLabels: Record<string, string> = { created: "待支付", paid: "已支付", cancelled: "已取消", failed: "失败", expired: "已过期", refunded: "已退款" };
export const kindLabels: Record<string, string> = { report: "完整报告", "pair-gift": "请 TA" };
export const pricingLabels: Record<string, string> = { list: "原价", invite: "邀请价", gift: "请 TA" };
export function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
export function filters(search: Search, now = new Date()) {
  const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00+08:00`)) && new Date(`${value}T00:00:00+08:00`).toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" }) === value;
  const today = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
  const endDate = date(one(search.end)) ? one(search.end) : today;
  const defaultStart = new Date(new Date(`${endDate}T00:00:00+08:00`).getTime() - 6 * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
  let startDate = date(one(search.start)) ? one(search.start) : defaultStart;
  const end = new Date(new Date(`${endDate}T00:00:00+08:00`).getTime() + 86400000);
  if (startDate > endDate || end.getTime() - new Date(`${startDate}T00:00:00+08:00`).getTime() > 90 * 86400000) startDate = defaultStart;
  const page = Math.min(10000, Math.max(1, Math.floor(Number(one(search.page)) || 1)));
  return {
    start: new Date(`${startDate}T00:00:00+08:00`), end, startDate, endDate, page,
    status: statuses.includes(one(search.status) as typeof statuses[number]) ? one(search.status) : "",
    provider: providers.includes(one(search.provider) as typeof providers[number]) ? one(search.provider) : "",
    locale: ["zh", "en"].includes(one(search.locale)) ? one(search.locale) : "",
    kind: ["report", "pair-gift"].includes(one(search.kind)) ? one(search.kind) : "",
    query: one(search.q).trim().slice(0, 80),
  };
}
export type Filters = ReturnType<typeof filters>;
export function pageHref(path: string, search: Search, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) if (typeof value === "string" && key !== "page") params.set(key, value);
  params.set("page", String(page));
  return `${path}?${params}`;
}
export function money(amount: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency === "USD" ? "USD" : "CNY" }).format(amount / 100);
}
export function time(value: Date | string | null) {
  return value ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "—";
}
export function maskOrder(id: string) { return `${id.slice(0, 9)}…${id.slice(-6)}`; }
export function visitorLabel(id: string) { return `访客 ${id.slice(0, 8)}`; }
