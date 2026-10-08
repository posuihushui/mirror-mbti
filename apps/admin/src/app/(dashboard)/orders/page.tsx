import { requireAdmin } from "@/lib/auth";
import { filters, type Search } from "@/lib/filters";
import { orderList } from "@/lib/data";
import { Heading, FilterForm, OrderTable, Pager } from "@/components/dashboard";
export default async function Orders({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin(); const search = await searchParams; const f = filters(search); const data = await orderList(f);
  return <><Heading title="订单情况">按日期、状态、渠道和商品查找。订单号以脱敏形式展示。</Heading><FilterForm f={f} orders /><section className="panel"><OrderTable rows={data.rows} /><Pager path="/orders" search={search} page={f.page} total={data.total} /></section></>;
}
