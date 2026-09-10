import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { getOrder, refreshOrder, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";

/** Order status for polling. Pending orders are re-checked with the provider when the callback is late. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话。");
  const order = await getOrder(id, visitorId);
  if (!order) return fail(404, "NOT_FOUND", "订单不存在。");
  const fresh = await refreshOrder(order);
  return ok(toOrderView(fresh), { headers: { "cache-control": "no-store" } });
}
