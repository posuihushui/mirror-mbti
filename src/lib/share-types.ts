import type { Locale } from "@/lib/i18n/locale";

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
