import "server-only";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderRow, PaymentChannel } from "@/db/schema";
import { appUrl, env, paymentModeFor, priceMinorFor } from "@/lib/env";
import { href, type Locale } from "@/lib/i18n/locale";
import { isValidOrderId, newOrderId } from "@/lib/ids";
import { hasClearPreference, typeMeta } from "@/lib/personality";
import { getCryptoProvider, getPaymentProvider } from "@/lib/payments";
import type { CryptoNetwork, OrderView, PaymentPayload, PaymentProvider } from "@/lib/payments/types";
import { questionnaireLocale } from "@/lib/questionnaires";
import { getResult, markResultUnlocked } from "@/lib/results";
import { pickWeChatChannel } from "@/lib/ua";

export const ORDER_TTL_MS = 15 * 60 * 1000;
/** On-chain payments take longer to send and confirm than WeChat Pay. */
export const CRYPTO_ORDER_TTL_MS = 30 * 60 * 1000;
/** Hosted card checkout: the buyer leaves the site, fills in billing details and comes back. */
export const CARD_ORDER_TTL_MS = 30 * 60 * 1000;
/** A payment that lands after its order expired still unlocks the report within this window. */
export const LATE_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Status polls arrive every couple of seconds; reads against a chain or a gateway are spaced out. */
const REMOTE_CHECK_INTERVAL_MS = 5000;
const lastRemoteCheck = new Map<string, number>();

const orderMessages = {
  zh: {
    notFound: "结果不存在。",
    notOwner: "只能为自己的测试结果购买报告。",
    unlocked: "这份报告已经解锁。",
    unclear: "本次回答暂未形成清晰倾向，请先检查答案或重新测试，暂不提供付费解锁。",
    openid: "需要先完成微信授权。",
    network: "请选择支付网络。",
    closed: "订单已关闭。",
    payerLocked: "该订单已绑定其他付款钱包。",
    notEthereum: "该订单不需要绑定钱包。",
    description: (type: string, name: string) => `观己 mirror 完整人格报告 · ${type} ${name}`,
  },
  en: {
    notFound: "Result not found.",
    notOwner: "You can only buy reports for your own test results.",
    unlocked: "This report is already unlocked.",
    unclear: "Your answers didn’t form a clear lean this time. Please review your answers or retake the test; no paid unlock is offered.",
    openid: "WeChat authorization is required first.",
    network: "Please choose a payment network.",
    closed: "This order is closed. Please start a new payment.",
    payerLocked: "This order is already linked to a different wallet. Start a new payment to use another wallet.",
    notEthereum: "This order doesn’t use a connected wallet.",
    description: (type: string) => `mirror full personality report · ${type}`,
  },
};

export class OrderError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** An order belongs to the language of the result it unlocks; its currency records that. */
export function orderLocale(order: Pick<OrderRow, "currency">): Locale {
  return order.currency === "USD" ? "en" : "zh";
}

export function toOrderView(order: OrderRow): OrderView {
  return {
    id: order.id,
    resultId: order.resultId,
    status: order.status,
    amountFen: order.amountFen,
    currency: order.currency,
    provider: order.provider,
    channel: order.channel,
    payload: (order.prepayPayload as PaymentPayload | null) ?? null,
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

function orderTtlMs(mode: PaymentProvider["mode"]): number {
  if (mode === "crypto") return CRYPTO_ORDER_TTL_MS;
  if (mode === "waffo") return CARD_ORDER_TTL_MS;
  return ORDER_TTL_MS;
}

export async function createOrder(input: { visitorId: string; resultId: string; userAgent: string | null; clientIp: string; openid?: string | null; locale?: Locale; network?: CryptoNetwork }) {
  const result = await getResult(input.resultId, input.visitorId);
  if (!result || result.sample) throw new OrderError(404, "RESULT_NOT_FOUND", orderMessages[input.locale ?? "zh"].notFound);
  // Price, currency, provider and copy follow the language the result was taken in.
  const locale = questionnaireLocale(result.questionnaireId);
  const t = orderMessages[locale];
  if (!result.owner) throw new OrderError(403, "NOT_OWNER", t.notOwner);
  if (result.unlocked) throw new OrderError(409, "ALREADY_UNLOCKED", t.unlocked);
  if (!hasClearPreference(result.profile)) throw new OrderError(422, "UNCLEAR_RESULT", t.unclear);

  const provider = await getPaymentProvider(paymentModeFor(locale));
  let channel: PaymentChannel;
  if (provider.mode === "crypto") {
    const { networks } = await getCryptoProvider();
    if (!input.network || !networks.includes(input.network)) throw new OrderError(400, "NETWORK_REQUIRED", t.network);
    channel = input.network;
  } else if (provider.mode === "waffo") {
    channel = "card";
  } else {
    channel = provider.mode === "mock" ? "mock" : pickWeChatChannel(input.userAgent);
  }
  if (channel === "jsapi" && !input.openid) throw new OrderError(428, "OPENID_REQUIRED", t.openid);

  const now = new Date();
  const id = newOrderId(now);
  const [order] = await db()
    .insert(schema.orders)
    .values({
      id,
      visitorId: input.visitorId,
      resultId: input.resultId,
      amountFen: priceMinorFor(locale),
      currency: locale === "en" ? "USD" : "CNY",
      provider: provider.mode,
      channel,
      status: "created",
      expiresAt: new Date(now.getTime() + orderTtlMs(provider.mode)),
    })
    .returning();

  const { name } = typeMeta(result.profile.type, locale);
  const base = appUrl();
  const payload = await provider.createPayment(order, {
    channel,
    openid: input.openid,
    clientIp: input.clientIp,
    userAgent: input.userAgent,
    description: t.description(result.profile.type, name),
    notifyUrl: env().WECHAT_PAY_NOTIFY_URL || `${base}/api/payments/wechat/notify`,
    returnUrl: `${base}${href(locale, `/pay/${id}`)}`,
    network: input.network,
  });

  const [updated] = await db()
    .update(schema.orders)
    .set({
      prepayPayload: payload,
      paymentReference: payload.kind === "solana" ? payload.reference : null,
      startBlock: payload.kind === "ethereum" ? payload.startBlock : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, id))
    .returning();
  return updated;
}

export async function getOrder(id: string, visitorId: string | null): Promise<OrderRow | null> {
  if (!isValidOrderId(id)) return null;
  const order = await db().query.orders.findFirst({ where: eq(schema.orders.id, id) });
  if (!order || (visitorId && order.visitorId !== visitorId)) return null;
  return order;
}

export async function getOrderByIdUnchecked(id: string): Promise<OrderRow | null> {
  return (await db().query.orders.findFirst({ where: eq(schema.orders.id, id) })) ?? null;
}

/**
 * Transitions `created` → `paid` exactly once and unlocks the result. Safe to call repeatedly.
 * Crypto and card orders may also move from `expired`: the buyer has already been charged and we
 * cannot undo an on-chain transfer or refund a card payment.
 */
export async function markOrderPaid(orderId: string, txnId: string | null, paidAt = new Date(), options: { allowExpired?: boolean } = {}): Promise<OrderRow | null> {
  const from: OrderRow["status"][] = options.allowExpired ? ["created", "expired"] : ["created"];
  const [order] = await db()
    .update(schema.orders)
    .set({ status: "paid", providerTxnId: txnId, paidAt, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, from)))
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

/**
 * Re-checks a pending order with its provider (active query fallback when the callback is late).
 * Crypto orders have no callback at all: the chain is read here. Both crypto and card orders are
 * checked before expiring and for a day afterwards, so a payment that lands late still unlocks the
 * report — the buyer has been charged either way.
 */
export async function refreshOrder(order: OrderRow): Promise<OrderRow> {
  const crypto = order.provider === "crypto";
  const remote = crypto || order.provider === "waffo";
  const now = Date.now();
  const expired = order.expiresAt.getTime() < now;
  const late = remote && order.status === "expired" && now - order.expiresAt.getTime() < LATE_PAYMENT_WINDOW_MS;
  if (order.status !== "created" && !late) return order;
  if (expired && !remote) return (await setOrderStatus(order.id, "expired")) ?? order;
  if (now - order.createdAt.getTime() < 3000) return order;
  // Query the provider that created the order, and only while that language still uses it.
  if (paymentModeFor(orderLocale(order)) !== order.provider) return order;
  // Crypto reads the chain and Waffo calls the gateway on every poll, so both are rate-limited per order.
  if (remote) {
    if (now - (lastRemoteCheck.get(order.id) ?? 0) < REMOTE_CHECK_INTERVAL_MS) return order;
    if (lastRemoteCheck.size > 5000) lastRemoteCheck.clear();
    lastRemoteCheck.set(order.id, now);
  }
  const provider = await getPaymentProvider(order.provider);
  try {
    const q = await provider.queryPayment(order);
    if (q.status === "paid" && !q.candidates) return (await markOrderPaid(order.id, q.txnId ?? null, q.paidAt, { allowExpired: remote })) ?? order;
    for (const candidate of q.candidates ?? []) {
      if (await claimPaymentEvent({ orderId: order.id, provider: order.provider, eventId: candidate.eventId, raw: candidate.raw })) {
        return (await markOrderPaid(order.id, candidate.txnId, new Date(), { allowExpired: crypto })) ?? order;
      }
    }
    if (q.status === "closed") return (await setOrderStatus(order.id, "cancelled")) ?? order;
  } catch (e) {
    console.error("[orders] queryPayment failed", order.id, e);
  }
  if (expired && order.status === "created") return (await setOrderStatus(order.id, "expired")) ?? order;
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

/**
 * Claims an on-chain transfer for one order. The unique `event_id` makes the first claim win, so a
 * transfer that could match two orders (same payer) unlocks only one. Re-claiming for the same
 * order is allowed, so a claim whose unlock failed can be retried.
 */
export async function claimPaymentEvent(input: { orderId: string; provider: OrderRow["provider"]; eventId: string; raw: Record<string, unknown> }): Promise<boolean> {
  if (await recordPaymentEvent({ ...input, kind: "transfer" })) return true;
  const existing = await db().query.paymentEvents.findFirst({ where: eq(schema.paymentEvents.eventId, input.eventId) });
  return existing?.orderId === input.orderId;
}

/** Links an Ethereum order to the wallet that signed its challenge. A payer can be set once. */
export async function confirmOrderPayer(order: OrderRow, payer: string, signature: string): Promise<OrderRow> {
  const t = orderMessages[orderLocale(order)];
  if (order.provider !== "crypto" || order.channel !== "ethereum") throw new OrderError(409, "NOT_ETHEREUM", t.notEthereum);
  if (order.status !== "created") throw new OrderError(409, "ORDER_CLOSED", t.closed);
  const verified = await (await getCryptoProvider()).verifyPayer(order, payer, signature);
  if (order.payerAddress && order.payerAddress !== verified) throw new OrderError(409, "PAYER_LOCKED", t.payerLocked);
  const payload = { ...(order.prepayPayload as Record<string, unknown>), payer: verified };
  const [updated] = await db()
    .update(schema.orders)
    .set({ payerAddress: verified, prepayPayload: payload, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, order.id), or(isNull(schema.orders.payerAddress), eq(schema.orders.payerAddress, verified))))
    .returning();
  if (!updated) throw new OrderError(409, "PAYER_LOCKED", t.payerLocked);
  return updated;
}

export async function latestOrderForResult(resultId: string, visitorId: string) {
  return (
    (await db().query.orders.findFirst({
      where: and(eq(schema.orders.resultId, resultId), eq(schema.orders.visitorId, visitorId)),
      orderBy: [desc(schema.orders.createdAt)],
    })) ?? null
  );
}
