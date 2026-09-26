import type { Locale } from "@/lib/i18n/locale";
import type { QuestionnaireId } from "@/lib/questionnaires";

/** Guides from an invitation that names the relationship. Invitations made before it still yield v3. */
export const COMPARE_CONTENT_VERSION = "compare-v4" as const;
export const COMPARE_V3_CONTENT_VERSION = "compare-v3" as const;
/** Published length of a host note. Lives here so client islands need no server-only module. */
export const HOST_NOTE_MAX = 30;
/**
 * v3 added `host_note`; v4 publishes the relationship the host names, which anyone holding the
 * link reads. The participant's scope is unchanged, so the guest version stays.
 */
export const COMPARE_HOST_CONSENT_VERSION = "compare-host-v4" as const;
export const COMPARE_GUEST_CONSENT_VERSION = "compare-guest-v2" as const;
export const COMPARE_DIMENSION_ORDER = ["EI", "JP", "TF", "SN"] as const;
export type CompareDimension = typeof COMPARE_DIMENSION_ORDER[number];
/** Reading order of the relationship choice; partner leads. */
export const COMPARE_RELATIONSHIPS = ["partner", "friend", "family", "colleague"] as const;
export type CompareRelationship = typeof COMPARE_RELATIONSHIPS[number];
export type CompareCategories = {
  EI: "E" | "I" | "balanced";
  SN: "S" | "N" | "balanced";
  TF: "T" | "F" | "balanced";
  JP: "J" | "P" | "balanced";
};
/** Construct only from a server-verified owned result after explicit consent. */
export type CompareSnapshot = {
  categories: CompareCategories;
  questionnaireId: QuestionnaireId;
  createdAt: string;
};
export type CompareRelation = "same-left" | "same-right" | "opposite" | "includes-balanced";
export type CompareSection = { title: string; body: string; practice?: string; openingLine?: string };
type CompareOutputBase = {
  locale: Locale;
  differentQuestionnaires: boolean;
};
/** Existing frozen v1 content remains readable without regeneration or new copy. */
export type CompareOutputSnapshotV1 = CompareOutputBase & {
  contentVersion: "compare-v1";
  sections: [CompareSection, CompareSection, CompareSection];
};
export type CompareOutputSnapshotV2 = CompareOutputBase & {
  contentVersion: "compare-v2";
  sections: [CompareSection, CompareSection, CompareSection & { openingLine: string; practice: string }];
};
/** One card per dimension, so every consented category reaches the reading. */
export type CompareDimensionCard = {
  dimension: CompareDimension;
  relation: CompareRelation;
  body: string;
  scene: string;
};
/** The single thing worth saying first; the one quote the reading is built around. */
export type CompareHighlight = {
  /** Absent when no dimension can carry the emphasis (all near-balanced, or all alike). */
  dimension?: CompareDimension;
  body: string;
  openingLine: string;
};
export type CompareOutputSnapshotV3 = CompareOutputBase & {
  contentVersion: typeof COMPARE_V3_CONTENT_VERSION;
  highlight: CompareHighlight;
  cards: [CompareDimensionCard, CompareDimensionCard, CompareDimensionCard, CompareDimensionCard];
  practice: string;
};
/** The relationship's own theme, read through the emphasised dimension (or generically). */
export type CompareTopic = { title: string; body: string };
/** v3's shape written for one relationship: its scenes, opening line and practice, plus a topic. */
export type CompareOutputSnapshotV4 = CompareOutputBase & {
  contentVersion: typeof COMPARE_CONTENT_VERSION;
  relationship: CompareRelationship;
  highlight: CompareHighlight;
  cards: [CompareDimensionCard, CompareDimensionCard, CompareDimensionCard, CompareDimensionCard];
  topic: CompareTopic;
  practice: string;
};
/** Both card-based shapes; v4 only adds to v3. */
export type CompareCardReading = CompareOutputSnapshotV3 | CompareOutputSnapshotV4;
export type CompareOutputSnapshot = CompareOutputSnapshotV1 | CompareOutputSnapshotV2 | CompareOutputSnapshotV3 | CompareOutputSnapshotV4;
/** Frozen content stored on a comparison row; older shapes render exactly as stored. */
export type CompareContent = CompareOutputSnapshot;
