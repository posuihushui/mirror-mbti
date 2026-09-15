import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { getOrder, refreshOrder, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";

const messages = {
  zh: { noSession: "缺少访客会话。", notFound: "订单不存在。" },
  en: { noSession: "Your visitor session is missing.", notFound: "Order not found." },
};

/** Order status for polling. Pending orders are re-checked with the provider when the callback is late. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const t = messages[requestLocale(req)];
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", t.noSession);
  const order = await getOrder(id, visitorId);
  if (!order) return fail(404, "NOT_FOUND", t.notFound);
  const fresh = await refreshOrder(order);
  return ok(toOrderView(fresh), { headers: { "cache-control": "no-store" } });
}
