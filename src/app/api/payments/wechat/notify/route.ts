import { NextResponse } from "next/server";
import { paymentMode } from "@/lib/env";
import { getOrderByIdUnchecked, markOrderPaid, recordPaymentEvent, setOrderStatus } from "@/lib/orders";
import { weChatClient } from "@/lib/payments/wechat";

type Notify = {
  id: string;
  event_type: string;
  resource_type: string;
  resource: { algorithm: string; ciphertext: string; nonce: string; associated_data?: string };
};

type Transaction = { out_trade_no: string; transaction_id?: string; trade_state: string; success_time?: string; amount?: { total: number } };

const okBody = { code: "SUCCESS", message: "成功" };
const failBody = (message: string) => ({ code: "FAIL", message });

/**
 * WeChat Pay APIv3 callback. Verifies the signature, decrypts the resource, records
 * the event once, checks the amount and flips the order to paid. Always answers
 * quickly; WeChat retries on non-2xx.
 */
export async function POST(req: Request) {
  if (paymentMode() !== "wechat") return NextResponse.json(failBody("provider disabled"), { status: 404 });

  const body = await req.text();
  const headers = {
    timestamp: req.headers.get("wechatpay-timestamp") ?? "",
    nonce: req.headers.get("wechatpay-nonce") ?? "",
    serial: req.headers.get("wechatpay-serial") ?? "",
    signature: req.headers.get("wechatpay-signature") ?? "",
  };

  const client = weChatClient();
  if (!(await client.verifySignature(headers, body))) {
    return NextResponse.json(failBody("signature verification failed"), { status: 401 });
  }

  let notify: Notify;
  let txn: Transaction;
  try {
    notify = JSON.parse(body) as Notify;
    txn = JSON.parse(client.decryptResource(notify.resource)) as Transaction;
  } catch (e) {
    console.error("[wechat notify] decode failed", e);
    return NextResponse.json(failBody("bad payload"), { status: 400 });
  }

  const order = await getOrderByIdUnchecked(txn.out_trade_no);
  const isNew = await recordPaymentEvent({
    orderId: order?.id ?? null,
    provider: "wechat",
    eventId: notify.id,
    kind: notify.event_type,
    raw: { ...notify, decrypted: txn } as Record<string, unknown>,
  });
  if (!isNew) return NextResponse.json(okBody);
  if (!order) return NextResponse.json(failBody("unknown order"), { status: 404 });

  if (txn.trade_state === "SUCCESS") {
    if (txn.amount && txn.amount.total !== order.amountFen) {
      console.error("[wechat notify] amount mismatch", order.id, txn.amount.total, order.amountFen);
      return NextResponse.json(failBody("amount mismatch"), { status: 400 });
    }
    await markOrderPaid(order.id, txn.transaction_id ?? null, txn.success_time ? new Date(txn.success_time) : new Date());
  } else if (txn.trade_state === "CLOSED" || txn.trade_state === "REVOKED" || txn.trade_state === "PAYERROR") {
    await setOrderStatus(order.id, txn.trade_state === "PAYERROR" ? "failed" : "cancelled");
  }
  return NextResponse.json(okBody);
}
