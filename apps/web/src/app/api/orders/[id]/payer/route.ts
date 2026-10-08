import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { confirmOrderPayer, getOrder, OrderError, toOrderView } from "@/lib/orders";
import { CryptoPayerError } from "@/lib/payments/crypto";
import { getVisitorId } from "@/lib/session";

const bodySchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(4096),
});

const messages = {
  zh: { noSession: "缺少访客会话。", notFound: "订单不存在。", invalid: "参数不正确。", signature: "签名与钱包地址不匹配。", failed: "暂时无法确认钱包，请稍后重试。" },
  en: { noSession: "Your visitor session is missing.", notFound: "Order not found.", invalid: "Invalid request.", signature: "The signature doesn’t match this wallet. Please sign again.", failed: "Couldn’t confirm the wallet right now. Please try again." },
};

/** Ethereum checkout: records the wallet that signed the order's challenge. Owner-only; the payer is set once. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const t = messages[requestLocale(req)];
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", t.noSession);
  const order = await getOrder((await ctx.params).id, visitorId);
  if (!order) return fail(404, "NOT_FOUND", t.notFound);
  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "INVALID_BODY", t.invalid);
  try {
    return ok(toOrderView(await confirmOrderPayer(order, parsed.data.address, parsed.data.signature)));
  } catch (e) {
    if (e instanceof OrderError) return fail(e.status, e.code, e.message);
    if (e instanceof CryptoPayerError) return fail(e.code === "INVALID_SIGNATURE" ? 400 : 409, e.code, t.signature);
    console.error("[orders] confirm payer failed", order.id, e instanceof Error ? e.name : e);
    return fail(503, "PAYER_UNAVAILABLE", t.failed);
  }
}
