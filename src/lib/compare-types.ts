import type { Locale } from "@/lib/i18n/locale";
import type { QuestionnaireId } from "@/lib/questionnaires";

export const COMPARE_CONTENT_VERSION = "compare-v2" as const;
export const COMPARE_HOST_CONSENT_VERSION = "compare-host-v2" as const;
export const COMPARE_GUEST_CONSENT_VERSION = "compare-guest-v2" as const;
export const COMPARE_DIMENSION_ORDER = ["EI", "JP", "TF", "SN"] as const;
export type CompareDimension = typeof COMPARE_DIMENSION_ORDER[number];
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
  contentVersion: typeof COMPARE_CONTENT_VERSION;
  sections: [CompareSection, CompareSection, CompareSection & { openingLine: string; practice: string }];
};
export type CompareOutputSnapshot = CompareOutputSnapshotV1 | CompareOutputSnapshotV2;
/** Frozen three-section content stored on a comparison row. */
export type CompareContent = CompareOutputSnapshot;
