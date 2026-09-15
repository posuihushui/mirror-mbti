import { fail, ok } from "@/lib/api";
import { paymentModeFor } from "@/lib/env";
import { getOrder, markOrderPaid, orderLocale, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";

/** Demo-only: marks a mock order as paid. Disabled for any language whose real provider is configured. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (paymentModeFor("zh") !== "mock" && paymentModeFor("en") !== "mock") return fail(404, "NOT_FOUND", "Not found");
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话。");
  const order = await getOrder(id, visitorId);
  if (!order) return fail(404, "NOT_FOUND", "订单不存在。");
  const en = orderLocale(order) === "en";
  if (order.provider !== "mock" || paymentModeFor(orderLocale(order)) !== "mock") return fail(404, "NOT_FOUND", "Not found");
  if (order.status !== "created" && order.status !== "paid") return fail(409, "ORDER_CLOSED", en ? "This order is closed." : "订单已关闭。");
  const paid = await markOrderPaid(order.id, `MOCK-${order.id}`);
  return ok(toOrderView(paid ?? order));
}
