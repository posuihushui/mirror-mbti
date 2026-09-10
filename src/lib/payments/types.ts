import type { OrderRow, PaymentChannel } from "@/db/schema";

export type PaymentPayload =
  | { kind: "mock" }
  | { kind: "jsapi"; params: { appId: string; timeStamp: string; nonceStr: string; package: string; signType: "RSA"; paySign: string } }
  | { kind: "native"; codeUrl: string; qrSvg: string }
  | { kind: "h5"; mwebUrl: string };

export type CreatePaymentContext = {
  channel: PaymentChannel;
  openid?: string | null;
  clientIp: string;
  userAgent: string | null;
  description: string;
  notifyUrl: string;
  /** Where H5 payments return after leaving WeChat. */
  returnUrl: string;
};

export type QueryPaymentResult = { status: "paid" | "pending" | "closed"; txnId?: string; paidAt?: Date };

export interface PaymentProvider {
  readonly mode: "mock" | "wechat";
  createPayment(order: OrderRow, ctx: CreatePaymentContext): Promise<PaymentPayload>;
  queryPayment(order: OrderRow): Promise<QueryPaymentResult>;
  closePayment?(order: OrderRow): Promise<void>;
}

/** Client-facing order shape returned by the orders API. */
export type OrderView = {
  id: string;
  resultId: string;
  status: OrderRow["status"];
  amountFen: number;
  provider: OrderRow["provider"];
  channel: PaymentChannel;
  payload: PaymentPayload | null;
  expiresAt: string;
  paidAt: string | null;
};
