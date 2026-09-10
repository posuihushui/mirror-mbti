import { z } from "zod";
import { clientIp, fail, ok, readJson } from "@/lib/api";
import { createOrder, OrderError, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";
import { getVisitorOpenid } from "@/lib/visitors";

const bodySchema = z.object({ resultId: z.string().min(1).max(32) });

/** Creates an order for a result and returns the provider payload needed to pay. */
export async function POST(req: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话，请刷新页面后重试。");
  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "INVALID_BODY", "参数不正确。");

  try {
    const openid = await getVisitorOpenid(visitorId);
    const order = await createOrder({
      visitorId,
      resultId: parsed.data.resultId,
      userAgent: req.headers.get("user-agent"),
      clientIp: clientIp(req),
      openid,
    });
    return ok(toOrderView(order), { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.status, e.code, e.message);
    console.error("[orders] create failed", e);
    return fail(500, "ORDER_FAILED", "暂时无法创建订单，请稍后重试。");
  }
}
