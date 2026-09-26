import { sql } from "drizzle-orm";
import { bigint, boolean, char, check, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uuid, varchar, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { PublicShareSnapshot } from "@/lib/share-types";
import type { CompareSnapshot, CompareContent, CompareRelationship } from "@/lib/compare-types";
import { LEGACY_QUESTIONNAIRE_ID, REPORT_VERSION, SCORING_VERSION, type ResponseItem } from "@/lib/questionnaires";

export const paymentProviderEnum = pgEnum("payment_provider", ["mock", "wechat", "crypto", "waffo"]);
export const paymentChannelEnum = pgEnum("payment_channel", ["mock", "jsapi", "native", "h5", "ethereum", "solana", "card"]);
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

export type OrderKind = "report" | "pair-gift";

/**
 * One purchase attempt. `id` doubles as the provider `out_trade_no`. A `report` order unlocks its
 * result; a `pair-gift` order is bought by an invitation's host, whose own result it carries, and
 * becomes a `pair_gifts` row that covers one participant's report when they join.
 */
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    kind: text("kind").$type<OrderKind>().default("report").notNull(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id),
    resultId: text("result_id")
      .notNull()
      .references(() => results.id),
    /** `pair-gift` only: the invitation the host bought it for. Where the gift sits now is `pair_gifts.invitation_id`. */
    invitationId: uuid("invitation_id").references((): AnyPgColumn => comparisonInvitations.id),
    amountFen: integer("amount_fen").notNull(),
    currency: char("currency", { length: 3 }).default("CNY").notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    channel: paymentChannelEnum("channel").notNull(),
    status: orderStatusEnum("status").default("created").notNull(),
    providerTxnId: text("provider_txn_id"),
    prepayPayload: jsonb("prepay_payload").$type<Record<string, unknown>>(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** Crypto (Ethereum): the wallet that signed this order's challenge, lowercase. Only its transfers count. */
    payerAddress: text("payer_address"),
    /** Crypto (Solana): the Solana Pay reference key, unique per order, that the payment transaction must carry. */
    paymentReference: text("payment_reference").unique(),
    /** Crypto (Ethereum): the first block searched for this order's transfer, fixed when the payer is confirmed. */
    startBlock: bigint("start_block", { mode: "number" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [index("orders_visitor_created_idx").on(t.visitorId, t.createdAt), index("orders_result_status_idx").on(t.resultId, t.status), check("orders_kind", sql`${t.kind} in ('report', 'pair-gift')`), check("orders_gift_invitation", sql`(${t.kind} = 'pair-gift') = (${t.invitationId} is not null)`)],
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

/** Immutable, explicitly published data. The token never grants ownership. */
export const resultShares = pgTable("result_shares", {
  id: uuid("id").primaryKey(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  visitorId: uuid("visitor_id").notNull().references(() => visitors.id),
  resultId: text("result_id").notNull().references(() => results.id),
  requestId: uuid("request_id").notNull(),
  requestHash: char("request_hash", { length: 64 }).notNull(),
  locale: varchar("locale", { length: 2 }).notNull(),
  contentVersion: text("content_version").notNull(),
  snapshot: jsonb("snapshot").$type<PublicShareSnapshot>().notNull(),
  selectedIds: text("selected_ids").array().notNull(),
  showType: boolean("show_type").notNull(),
  showDimensions: boolean("show_dimensions").notNull(),
  consentVersion: text("consent_version").notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex("shares_owner_request_idx").on(t.visitorId, t.requestId), index("shares_owner_created_idx").on(t.visitorId, t.createdAt, t.id)]);

export const shareRateLimits = pgTable("share_rate_limits", {
  bucketKey: char("bucket_key", { length: 64 }).primaryKey(),
  attempts: integer("attempts").default(1).notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referralAttributions = pgTable("referral_attributions", {
  invitationId: uuid("invitation_id").references(() => comparisonInvitations.id),
  visitorId: uuid("visitor_id").primaryKey().references(() => visitors.id),
  shareId: uuid("share_id").references(() => resultShares.id),
  firstTouchAt: timestamp("first_touch_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  quizStartedAt: timestamp("quiz_started_at", { withTimezone: true }),
  firstResultId: text("first_result_id").unique().references(() => results.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [index("attributions_share_completed_idx").on(t.shareId, t.completedAt), index("attributions_invitation_completed_idx").on(t.invitationId, t.completedAt), check("attributions_one_source", sql`num_nonnulls(${t.shareId}, ${t.invitationId}) = 1`)]);

export type PairingAccessPolicy = "legacy-free-v1" | "paid-pair-v2";
export const comparisonInvitations = pgTable("comparison_invitations", {
  accessPolicy: text("access_policy").$type<PairingAccessPolicy>().default("paid-pair-v2").notNull(),
  id: uuid("id").primaryKey(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  shareId: uuid("share_id").references(() => resultShares.id),
  visitorId: uuid("visitor_id").notNull().references(() => visitors.id),
  resultId: text("result_id").notNull().references(() => results.id),
  locale: varchar("locale", { length: 2 }).notNull(),
  publicSnapshot: jsonb("public_snapshot").$type<CompareSnapshot>().notNull(),
  /** Optional plain-text line the host wrote for this invitation; public to anyone holding the link. */
  hostNote: varchar("host_note", { length: 30 }),
  /** Chosen by the host under `compare-host-v4` and public to anyone holding the link; null before it. */
  relationship: text("relationship").$type<CompareRelationship>(),
  contentVersion: text("content_version").notNull(),
  consentVersion: text("consent_version").notNull(),
  requestId: uuid("request_id").notNull(),
  requestHash: char("request_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex("comparison_invitation_request_idx").on(t.visitorId, t.requestId), index("comparison_invitation_share_idx").on(t.shareId), index("comparison_invitation_result_idx").on(t.resultId, t.createdAt), check("invitation_access_policy", sql`${t.accessPolicy} in ('legacy-free-v1', 'paid-pair-v2')`), check("invitation_relationship", sql`${t.relationship} in ('partner', 'friend', 'family', 'colleague')`)]);

export const comparisons = pgTable("comparisons", {
  accessPolicy: text("access_policy").$type<PairingAccessPolicy>().default("paid-pair-v2").notNull(),
  id: uuid("id").primaryKey(),
  invitationId: uuid("invitation_id").notNull().references(() => comparisonInvitations.id),
  hostVisitorId: uuid("host_visitor_id").notNull().references(() => visitors.id),
  guestVisitorId: uuid("guest_visitor_id").notNull().references(() => visitors.id),
  guestResultId: text("guest_result_id").notNull().references(() => results.id),
  hostSnapshot: jsonb("host_snapshot").$type<CompareSnapshot>().notNull(),
  guestSnapshot: jsonb("guest_snapshot").$type<CompareSnapshot>().notNull(),
  contentVersion: text("content_version").notNull(),
  /** Copied from the invitation at join; null for guides made before relationships existed. */
  relationship: text("relationship").$type<CompareRelationship>(),
  locale: varchar("locale", { length: 2 }).notNull(),
  outputSnapshot: jsonb("output_snapshot").$type<CompareContent>().notNull(),
  guestConsentVersion: text("guest_consent_version").notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedBy: uuid("revoked_by").references(() => visitors.id),
  ...timestamps,
}, (t) => [uniqueIndex("comparison_invitation_guest_idx").on(t.invitationId, t.guestVisitorId), index("comparison_host_created_idx").on(t.hostVisitorId, t.createdAt), index("comparison_guest_created_idx").on(t.guestVisitorId, t.createdAt), check("comparison_access_policy", sql`${t.accessPolicy} in ('legacy-free-v1', 'paid-pair-v2')`), check("comparison_relationship", sql`${t.relationship} in ('partner', 'friend', 'family', 'colleague')`)]);

/**
 * One participant's report, covered by an invitation's host (a paid `pair-gift` order). It sits on
 * one invitation until someone who has not unlocked their result joins it; a gift whose invitation
 * closes or expires unclaimed moves to the host's next invitation in the same language.
 */
export const pairGifts = pgTable("pair_gifts", {
  id: uuid("id").primaryKey(),
  orderId: text("order_id").notNull().unique().references(() => orders.id),
  visitorId: uuid("visitor_id").notNull().references(() => visitors.id),
  locale: varchar("locale", { length: 2 }).notNull(),
  invitationId: uuid("invitation_id").references(() => comparisonInvitations.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  claimedVisitorId: uuid("claimed_visitor_id").references(() => visitors.id),
  claimedResultId: text("claimed_result_id").unique().references(() => results.id),
  ...timestamps,
}, (t) => [
  uniqueIndex("pair_gifts_open_invitation_idx").on(t.invitationId).where(sql`${t.claimedAt} is null`),
  index("pair_gifts_owner_idx").on(t.visitorId, t.createdAt),
  check("pair_gifts_claim", sql`(${t.claimedAt} is null) = (${t.claimedResultId} is null) and (${t.claimedAt} is null) = (${t.claimedVisitorId} is null)`),
]);

export const comparisonContinuations = pgTable("comparison_continuations", {
  id: uuid("id").primaryKey(),
  visitorId: uuid("visitor_id").notNull().references(() => visitors.id),
  invitationId: uuid("invitation_id").notNull().references(() => comparisonInvitations.id),
  resultId: text("result_id").notNull().references(() => results.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("continuations_owner_invitation_result_idx").on(t.visitorId, t.invitationId, t.resultId), index("continuations_owner_result_idx").on(t.visitorId, t.resultId), index("continuations_expiry_idx").on(t.expiresAt)]);

export const shareEvents = pgTable("share_events", {
  invitationId: uuid("invitation_id").references(() => comparisonInvitations.id),
  ownerResultId: text("owner_result_id").references(() => results.id),
  eligibilityAtEvent: text("eligibility_at_event").$type<"eligible" | "locked" | "unavailable" | "syncing">(),
  ruleVersion: text("rule_version").default("first-touch-v1").notNull(),
  id: uuid("id").primaryKey(),
  eventName: text("event_name").notNull(),
  shareId: uuid("share_id").references(() => resultShares.id),
  pairId: uuid("pair_id").references(() => comparisons.id),
  actorVisitorId: uuid("actor_visitor_id").notNull().references(() => visitors.id),
  locale: varchar("locale", { length: 2 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  channel: text("channel").notNull(),
  surface: text("surface").notNull(),
}, (t) => [index("share_events_kind_time_idx").on(t.eventName, t.occurredAt), index("share_events_resource_actor_time_idx").on(t.shareId, t.actorVisitorId, t.occurredAt), index("share_events_invitation_time_idx").on(t.invitationId, t.occurredAt), index("share_events_owner_result_time_idx").on(t.ownerResultId, t.occurredAt), check("share_events_one_source", sql`num_nonnulls(${t.shareId}, ${t.invitationId}) <= 1`), check("share_events_eligibility", sql`${t.eligibilityAtEvent} in ('eligible', 'locked', 'unavailable', 'syncing')`)]);
