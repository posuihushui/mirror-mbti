import type { OrderRow, PaymentChannel } from "@/db/schema";

export type CryptoNetwork = "ethereum" | "solana";

/** A stablecoin accepted on a network: an ERC-20 contract address or a Solana mint. */
export type CryptoToken = { symbol: "USDC" | "USDT"; address: string; decimals: number };

export type PaymentPayload =
  | { kind: "mock" }
  | { kind: "jsapi"; params: { appId: string; timeStamp: string; nonceStr: string; package: string; signType: "RSA"; paySign: string } }
  | { kind: "native"; codeUrl: string; qrSvg: string }
  | { kind: "h5"; mwebUrl: string }
  /** Hosted checkout (Waffo Pancake): the buyer leaves for `url` and returns to the pay page. */
  | { kind: "redirect"; url: string; expiresAt: string }
  /** Solana Pay transfer requests, one per accepted token, sharing the order's reference key. */
  | { kind: "solana"; recipient: string; reference: string; amount: string; tokens: (CryptoToken & { url: string; qrSvg: string })[] }
  /** Ethereum: the payer signs `challenge` first; then any accepted-token transfer from that wallet counts. */
  | { kind: "ethereum"; chainId: number; recipient: string; amount: string; tokens: CryptoToken[]; challenge: string; payer: string | null; explorer: string; startBlock: number };

export type CreatePaymentContext = {
  channel: PaymentChannel;
  openid?: string | null;
  clientIp: string;
  userAgent: string | null;
  description: string;
  notifyUrl: string;
  /** Where H5 payments return after leaving WeChat. */
  returnUrl: string;
  /** Crypto orders: the network the buyer chose. */
  network?: CryptoNetwork;
};

/** An on-chain transfer that could pay an order. It pays only if its `eventId` is claimed for that order first. */
export type PaymentCandidate = { eventId: string; txnId: string; raw: Record<string, unknown> };

export type QueryPaymentResult = { status: "paid" | "pending" | "closed"; txnId?: string; paidAt?: Date; candidates?: PaymentCandidate[] };

export interface PaymentProvider {
  readonly mode: "mock" | "wechat" | "crypto" | "waffo";
  createPayment(order: OrderRow, ctx: CreatePaymentContext): Promise<PaymentPayload>;
  queryPayment(order: OrderRow): Promise<QueryPaymentResult>;
  closePayment?(order: OrderRow): Promise<void>;
}

/** Client-facing order shape returned by the orders API. */
export type OrderView = {
  id: string;
  resultId: string;
  status: OrderRow["status"];
  /** Minor units of `currency`: fen for CNY, cents for USD. */
  amountFen: number;
  currency: string;
  provider: OrderRow["provider"];
  channel: PaymentChannel;
  payload: PaymentPayload | null;
  expiresAt: string;
  paidAt: string | null;
};
