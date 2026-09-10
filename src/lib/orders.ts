import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderRow, PaymentChannel } from "@/db/schema";
import { appUrl, env, priceFen } from "@/lib/env";
import { newOrderId } from "@/lib/ids";
import { typeMeta } from "@/lib/personality";
import { getPaymentProvider } from "@/lib/payments";
import type { OrderView, PaymentPayload } from "@/lib/payments/types";
import { getResult, markResultUnlocked } from "@/lib/results";
import { pickWeChatChannel } from "@/lib/ua";

export const ORDER_TTL_MS = 15 * 60 * 1000;

export class OrderError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function toOrderView(order: OrderRow): OrderView {
  return {
    id: order.id,
    resultId: order.resultId,
    status: order.status,
    amountFen: order.amountFen,
    provider: order.provider,
    channel: order.channel,
    payload: (order.prepayPayload as PaymentPayload | null) ?? null,
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export async function createOrder(input: { visitorId: string; resultId: string; userAgent: string | null; clientIp: string; openid?: string | null }) {
  const result = await getResult(input.resultId, input.visitorId);
  if (!result || result.sample) throw new OrderError(404, "RESULT_NOT_FOUND", "结果不存在。");
  if (!result.owner) throw new OrderError(403, "NOT_OWNER", "只能为自己的测试结果购买报告。");
  if (result.unlocked) throw new OrderError(409, "ALREADY_UNLOCKED", "这份报告已经解锁。");

  const provider = await getPaymentProvider();
  const channel: PaymentChannel = provider.mode === "mock" ? "mock" : pickWeChatChannel(input.userAgent);
  if (channel === "jsapi" && !input.openid) throw new OrderError(428, "OPENID_REQUIRED", "需要先完成微信授权。");

  const now = new Date();
  const id = newOrderId(now);
  const [order] = await db()
    .insert(schema.orders)
    .values({
      id,
      visitorId: input.visitorId,
      resultId: input.resultId,
      amountFen: priceFen(),
      provider: provider.mode,
      channel,
      status: "created",
      expiresAt: new Date(now.getTime() + ORDER_TTL_MS),
    })
    .returning();

  const { name } = typeMeta(result.profile.type);
  const base = appUrl();
  const payload = await provider.createPayment(order, {
    channel,
    openid: input.openid,
    clientIp: input.clientIp,
    userAgent: input.userAgent,
    description: `观己 mirror 完整人格报告 · ${result.profile.type} ${name}`,
    notifyUrl: env().WECHAT_PAY_NOTIFY_URL || `${base}/api/payments/wechat/notify`,
    returnUrl: `${base}/pay/${id}`,
  });

  const [updated] = await db().update(schema.orders).set({ prepayPayload: payload, updatedAt: new Date() }).where(eq(schema.orders.id, id)).returning();
  return updated;
}

export async function getOrder(id: string, visitorId: string | null): Promise<OrderRow | null> {
  if (!/^M\d{8}[0-9A-F]{16}$/.test(id)) return null;
  const order = await db().query.orders.findFirst({ where: eq(schema.orders.id, id) });
  if (!order || (visitorId && order.visitorId !== visitorId)) return null;
  return order;
}

export async function getOrderByIdUnchecked(id: string): Promise<OrderRow | null> {
  return (await db().query.orders.findFirst({ where: eq(schema.orders.id, id) })) ?? null;
}

/** Transitions `created` → `paid` exactly once and unlocks the result. Safe to call repeatedly. */
export async function markOrderPaid(orderId: string, txnId: string | null, paidAt = new Date()): Promise<OrderRow | null> {
  const [order] = await db()
    .update(schema.orders)
    .set({ status: "paid", providerTxnId: txnId, paidAt, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "created")))
    .returning();
  if (order) await markResultUnlocked(order.resultId, order.id);
  return order ?? (await getOrderByIdUnchecked(orderId));
}

export async function setOrderStatus(orderId: string, status: OrderRow["status"]) {
  const [order] = await db()
    .update(schema.orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "created")))
    .returning();
  return order ?? null;
}

/** Re-checks a pending order with the provider (active query fallback when the callback is late). */
export async function refreshOrder(order: OrderRow): Promise<OrderRow> {
  if (order.status !== "created") return order;
  if (order.expiresAt.getTime() < Date.now()) {
    return (await setOrderStatus(order.id, "expired")) ?? order;
  }
  const ageMs = Date.now() - order.createdAt.getTime();
  if (ageMs < 3000) return order;
  const provider = await getPaymentProvider();
  if (provider.mode !== order.provider) return order;
  try {
    const q = await provider.queryPayment(order);
    if (q.status === "paid") return (await markOrderPaid(order.id, q.txnId ?? null, q.paidAt)) ?? order;
    if (q.status === "closed") return (await setOrderStatus(order.id, "cancelled")) ?? order;
  } catch (e) {
    console.error("[orders] queryPayment failed", order.id, e);
  }
  return order;
}

export async function recordPaymentEvent(input: { orderId: string | null; provider: OrderRow["provider"]; eventId: string | null; kind: string; raw: Record<string, unknown> }) {
  const rows = await db()
    .insert(schema.paymentEvents)
    .values({ orderId: input.orderId, provider: input.provider, eventId: input.eventId, kind: input.kind, raw: input.raw })
    .onConflictDoNothing({ target: schema.paymentEvents.eventId })
    .returning({ id: schema.paymentEvents.id });
  return rows.length > 0;
}

export async function latestOrderForResult(resultId: string, visitorId: string) {
  return (
    (await db().query.orders.findFirst({
      where: and(eq(schema.orders.resultId, resultId), eq(schema.orders.visitorId, visitorId)),
      orderBy: [desc(schema.orders.createdAt)],
    })) ?? null
  );
}
