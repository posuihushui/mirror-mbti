import type { Locale } from "@/lib/i18n/locale";
import type { QuestionnaireId } from "@/lib/questionnaires";

export const COMPARE_CONTENT_VERSION = "compare-v1" as const;
export const COMPARE_HOST_CONSENT_VERSION = "compare-host-v1" as const;
export const COMPARE_GUEST_CONSENT_VERSION = "compare-guest-v1" as const;
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
export type CompareSection = { title: string; body: string; practice?: string };
export type CompareOutputSnapshot = {
  contentVersion: typeof COMPARE_CONTENT_VERSION;
  locale: Locale;
  differentQuestionnaires: boolean;
  sections: [CompareSection, CompareSection, CompareSection];
};
/** Frozen three-section content stored on a comparison row. */
export type CompareContent = CompareOutputSnapshot;
