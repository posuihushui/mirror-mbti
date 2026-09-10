import { fail, ok } from "@/lib/api";
import { paymentMode } from "@/lib/env";
import { getOrder, markOrderPaid, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";

/** Demo-only: marks the order as paid. Disabled entirely when a real provider is configured. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (paymentMode() !== "mock") return fail(404, "NOT_FOUND", "Not found");
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话。");
  const order = await getOrder(id, visitorId);
  if (!order) return fail(404, "NOT_FOUND", "订单不存在。");
  if (order.status !== "created" && order.status !== "paid") return fail(409, "ORDER_CLOSED", "订单已关闭。");
  const paid = await markOrderPaid(order.id, `MOCK-${order.id}`);
  return ok(toOrderView(paid ?? order));
}
