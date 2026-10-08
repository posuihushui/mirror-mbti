import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { visitorForRecoveryOrder } from "@/lib/recovery";

const mocks = vi.hoisted(() => ({ findOrder: vi.fn() }));
vi.mock("@/db", async () => ({
  schema: await import("@/db/schema"),
  db: () => ({ query: { orders: { findFirst: mocks.findOrder } } }),
}));

beforeEach(() => vi.clearAllMocks());

describe("recovery owner lookup", () => {
  it("uses only the exact order id and selects only its owner, independent of payment status", async () => {
    const visitorId = "419432da-4c90-4c02-b445-ac94c35f414e";
    mocks.findOrder.mockResolvedValue({ visitorId });
    expect(await visitorForRecoveryOrder("M2026091000000000DEADBEEF")).toBe(visitorId);
    const query = mocks.findOrder.mock.calls[0][0];
    expect(query.columns).toEqual({ visitorId: true });
    expect(new PgDialect().sqlToQuery(query.where)).toMatchObject({ sql: '"orders"."id" = $1', params: ["M2026091000000000DEADBEEF"] });
    // No payment mutation API is available on this database double.
  });

  it("rejects partial order ids without touching storage", async () => {
    expect(await visitorForRecoveryOrder("DEADBEEF")).toBeNull();
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  it("returns no owner for an unknown complete order number", async () => {
    mocks.findOrder.mockResolvedValue(undefined);
    expect(await visitorForRecoveryOrder("M2026091000000000DEADBEEF123456")).toBeNull();
  });
});
