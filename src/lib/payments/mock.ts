import type { OrderRow } from "@/db/schema";
import type { PaymentProvider } from "./types";

/**
 * Demo provider: no money moves. The client calls `/api/orders/[id]/mock-pay`
 * to flip the order to `paid`, mirroring the prototype's simulated flow.
 */
export const mockProvider: PaymentProvider = {
  mode: "mock",
  async createPayment() {
    return { kind: "mock" };
  },
  async queryPayment(order: OrderRow) {
    return order.status === "paid" ? { status: "paid", txnId: order.providerTxnId ?? undefined } : { status: "pending" };
  },
};
