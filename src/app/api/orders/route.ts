import { z } from "zod";
import { clientIp, fail, ok, readJson } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { createOrder, OrderError, toOrderView } from "@/lib/orders";
import { getVisitorId } from "@/lib/session";
import { getVisitorOpenid } from "@/lib/visitors";

const network = z.enum(["ethereum", "solana"]).optional();
/** A report for one of the visitor's results, or a gift (请 TA) for one of their open invitations. */
const bodySchema = z.union([
  z.object({ kind: z.literal("report").optional(), resultId: z.string().min(1).max(32), network }).strict(),
  z.object({ kind: z.literal("pair-gift"), invitationId: z.uuid(), network }).strict(),
]);

const messages = {
  zh: { noSession: "缺少访客会话，请刷新页面后重试。", invalid: "参数不正确。", failed: "暂时无法创建订单，请稍后重试。" },
  en: { noSession: "Your visitor session is missing. Please refresh the page and try again.", invalid: "Invalid request.", failed: "Couldn’t create the order right now. Please try again later." },
};

/** Creates an order and returns the provider payload needed to pay. */
export async function POST(req: Request) {
  const locale = requestLocale(req);
  const t = messages[locale];
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", t.noSession);
  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "INVALID_BODY", t.invalid);

  try {
    const openid = await getVisitorOpenid(visitorId);
    const base = { visitorId, userAgent: req.headers.get("user-agent"), clientIp: clientIp(req), openid, locale, network: parsed.data.network };
    const order = await createOrder(parsed.data.kind === "pair-gift"
      ? { ...base, kind: "pair-gift", invitationId: parsed.data.invitationId }
      : { ...base, resultId: parsed.data.resultId });
    return ok(toOrderView(order), { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.status, e.code, e.message);
    console.error("[orders] create failed", e);
    return fail(500, "ORDER_FAILED", t.failed);
  }
}
