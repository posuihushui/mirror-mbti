import "server-only";
import QRCode from "qrcode";
import type { OrderRow } from "@/db/schema";
import type { PaymentProvider, QueryPaymentResult } from "../types";
import { WeChatPayClient } from "./client";
import { weChatPayConfig } from "./config";
import { jsapiPayParams } from "./crypto";

type TradeState = "SUCCESS" | "REFUND" | "NOTPAY" | "CLOSED" | "REVOKED" | "USERPAYING" | "PAYERROR";
type Transaction = { trade_state: TradeState; transaction_id?: string; success_time?: string; out_trade_no: string; amount?: { total: number } };

function rfc3339(date: Date) {
  // WeChat requires +08:00 style offsets; format in Beijing time.
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, "+08:00");
}

export function mapTradeState(t: Transaction): QueryPaymentResult {
  if (t.trade_state === "SUCCESS") return { status: "paid", txnId: t.transaction_id, paidAt: t.success_time ? new Date(t.success_time) : undefined };
  if (t.trade_state === "CLOSED" || t.trade_state === "REVOKED" || t.trade_state === "PAYERROR") return { status: "closed" };
  return { status: "pending" };
}

/** WeChat Pay APIv3 provider: JSAPI inside WeChat, H5 in mobile browsers, Native QR on desktop. */
export function createWeChatProvider(): PaymentProvider {
  const cfg = weChatPayConfig();
  const client = new WeChatPayClient(cfg);

  const baseBody = (order: OrderRow, description: string, notifyUrl: string) => ({
    appid: cfg.appid,
    mchid: cfg.mchid,
    description: description.slice(0, 127),
    out_trade_no: order.id,
    time_expire: rfc3339(order.expiresAt),
    notify_url: notifyUrl,
    amount: { total: order.amountFen, currency: "CNY" },
  });

  return {
    mode: "wechat",
    async createPayment(order, ctx) {
      if (ctx.channel === "jsapi") {
        const { prepay_id } = await client.request<{ prepay_id: string }>("POST", "/v3/pay/transactions/jsapi", {
          ...baseBody(order, ctx.description, ctx.notifyUrl),
          payer: { openid: ctx.openid },
        });
        return { kind: "jsapi", params: jsapiPayParams(cfg.appid, prepay_id, cfg.privateKey) };
      }
      if (ctx.channel === "h5") {
        const { h5_url } = await client.request<{ h5_url: string }>("POST", "/v3/pay/transactions/h5", {
          ...baseBody(order, ctx.description, ctx.notifyUrl),
          scene_info: { payer_client_ip: ctx.clientIp, h5_info: { type: "Wap" } },
        });
        const sep = h5_url.includes("?") ? "&" : "?";
        return { kind: "h5", mwebUrl: `${h5_url}${sep}redirect_url=${encodeURIComponent(ctx.returnUrl)}` };
      }
      const { code_url } = await client.request<{ code_url: string }>("POST", "/v3/pay/transactions/native", baseBody(order, ctx.description, ctx.notifyUrl));
      const qrSvg = await QRCode.toString(code_url, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
      return { kind: "native", codeUrl: code_url, qrSvg };
    },
    async queryPayment(order) {
      const t = await client.request<Transaction>("GET", `/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.id)}?mchid=${cfg.mchid}`);
      return mapTradeState(t);
    },
    async closePayment(order) {
      await client.request("POST", `/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.id)}/close`, { mchid: cfg.mchid });
    },
  };
}

export function weChatClient() {
  return new WeChatPayClient(weChatPayConfig());
}
