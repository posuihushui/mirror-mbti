/** Versioned values and JSON contracts persisted in the shared database. */
export type Locale = "en" | "zh";
export const LEGACY_QUESTIONNAIRE_ID = "legacy32-v1";
export const STANDARD_QUESTIONNAIRE_ID = "standard64-v1";
export const EN_QUICK_QUESTIONNAIRE_ID = "en32-v1";
export const EN_STANDARD_QUESTIONNAIRE_ID = "en64-v1";
// v2 assigns four letters to every completed questionnaire: an exact tie now goes to I / N / F / P.
export const SCORING_VERSION = "preference-v2";
export const REPORT_VERSION = "context-v2";
export type QuestionnaireId = typeof LEGACY_QUESTIONNAIRE_ID | typeof STANDARD_QUESTIONNAIRE_ID | typeof EN_QUICK_QUESTIONNAIRE_ID | typeof EN_STANDARD_QUESTIONNAIRE_ID;
export type ResponseItem = { questionId: string; value: number };


export type ShareDimension = "EI" | "SN" | "TF" | "JP";
export type DimensionState = "left" | "balanced" | "right";
export type PublicDimension = { dimension: ShareDimension; state: DimensionState; label: string };
export type ShareCandidate = { id: string; dimension: ShareDimension; text: string };
/** This is the entire public contract. Never extend it with owner/result/profile fields. */
export type PublicShareSnapshot = {
  version: "share-v1";
  locale: Locale;
  lines: [string, string, string];
  typeLabel?: string;
  typeNote?: string;
  dimensions?: [PublicDimension, PublicDimension, PublicDimension, PublicDimension];
  disclaimer: string;
};


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
