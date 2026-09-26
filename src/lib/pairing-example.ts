import { generateCompareContent, generateRelationshipContent } from "@/lib/compare-content";
import type { CompareOutputSnapshotV3, CompareOutputSnapshotV4, CompareRelationship, CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";

export type PairingExample = {
  host: CompareSnapshot;
  guest: CompareSnapshot;
  content: CompareOutputSnapshotV3 | CompareOutputSnapshotV4;
};

/**
 * Fixed fictional inputs, never the visitor's or an invitation host's preferences. With a
 * relationship it is written for that relationship (v4); without one it stays the v3 example.
 */
export function getPairingExample(locale: Locale = "zh", relationship: CompareRelationship | null = null): PairingExample {
  const base = {
    questionnaireId: locale === "en" ? "en32-v1" as const : "legacy32-v1" as const,
    createdAt: "2026-09-01T00:00:00.000Z",
  };
  const host: CompareSnapshot = { ...base, categories: { EI: "balanced", SN: "balanced", TF: "balanced", JP: "J" } };
  const guest: CompareSnapshot = { ...base, categories: { EI: "balanced", SN: "balanced", TF: "balanced", JP: "P" } };
  const content = relationship ? generateRelationshipContent(host, guest, relationship, locale) : generateCompareContent(host, guest, locale);
  return { host, guest, content };
}
