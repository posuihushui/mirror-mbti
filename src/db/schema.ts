import { boolean, char, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { LEGACY_QUESTIONNAIRE_ID, REPORT_VERSION, SCORING_VERSION, type ResponseItem } from "@/lib/questionnaires";

export const paymentProviderEnum = pgEnum("payment_provider", ["mock", "wechat"]);
export const paymentChannelEnum = pgEnum("payment_channel", ["mock", "jsapi", "native", "h5"]);
export const orderStatusEnum = pgEnum("order_status", ["created", "paid", "cancelled", "failed", "expired", "refunded"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
};

/** Anonymous visitor identified by the signed `mid` cookie. */
export const visitors = pgTable("visitors", {
  id: uuid("id").primaryKey(),
  wechatOpenid: text("wechat_openid"),
  userAgent: text("user_agent"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
});

/** A completed questionnaire, scored on the server. */
export const results = pgTable(
  "results",
  {
    id: text("id").primaryKey(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id),
    answers: jsonb("answers").$type<number[]>().notNull(),
    questionnaireId: text("questionnaire_id").default(LEGACY_QUESTIONNAIRE_ID).notNull(),
    questionCount: integer("question_count").default(32).notNull(),
    responses: jsonb("responses").$type<ResponseItem[]>(),
    scoringVersion: text("scoring_version").default(SCORING_VERSION).notNull(),
    reportVersion: text("report_version").default(REPORT_VERSION).notNull(),
    type: char("type", { length: 4 }).notNull(),
    values: integer("values").array().notNull(),
    balanced: boolean("balanced").array().notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
    unlockOrderId: text("unlock_order_id"),
    ...timestamps,
  },
  (t) => [index("results_visitor_created_idx").on(t.visitorId, t.createdAt)],
);

/** One purchase attempt for a result. `id` doubles as the provider `out_trade_no`. */
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id),
    resultId: text("result_id")
      .notNull()
      .references(() => results.id),
    amountFen: integer("amount_fen").notNull(),
    currency: char("currency", { length: 3 }).default("CNY").notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    channel: paymentChannelEnum("channel").notNull(),
    status: orderStatusEnum("status").default("created").notNull(),
    providerTxnId: text("provider_txn_id"),
    prepayPayload: jsonb("prepay_payload").$type<Record<string, unknown>>(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [index("orders_visitor_created_idx").on(t.visitorId, t.createdAt), index("orders_result_status_idx").on(t.resultId, t.status)],
);

/** Raw provider callbacks, keyed by the provider event id for idempotency. */
export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").references(() => orders.id),
  provider: paymentProviderEnum("provider").notNull(),
  eventId: text("event_id").unique(),
  kind: text("kind").notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
  ...timestamps,
});

/** Atomic recovery throttles. Keys are secret-keyed IP hashes, never raw IPs or order numbers. */
export const recoveryAttempts = pgTable(
  "recovery_attempts",
  {
    bucketKey: char("bucket_key", { length: 64 }).primaryKey(),
    attempts: integer("attempts").default(1).notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("recovery_attempts_window_idx").on(t.windowStartedAt)],
);

export type Visitor = typeof visitors.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderStatus = OrderRow["status"];
export type PaymentChannel = OrderRow["channel"];
export type PaymentProviderName = OrderRow["provider"];
