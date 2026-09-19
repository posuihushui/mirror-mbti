import { generateCompareContent } from "@/lib/compare-content";
import type { CompareOutputSnapshotV2, CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";

export type PairingExample = {
  host: CompareSnapshot;
  guest: CompareSnapshot;
  content: CompareOutputSnapshotV2;
};

/** Fixed fictional inputs, never the visitor's or an invitation host's preferences. */
export function getPairingExample(locale: Locale = "zh"): PairingExample {
  const base = {
    questionnaireId: locale === "en" ? "en32-v1" as const : "legacy32-v1" as const,
    createdAt: "2026-09-01T00:00:00.000Z",
  };
  const host: CompareSnapshot = { ...base, categories: { EI: "balanced", SN: "balanced", TF: "balanced", JP: "J" } };
  const guest: CompareSnapshot = { ...base, categories: { EI: "balanced", SN: "balanced", TF: "balanced", JP: "P" } };
  return { host, guest, content: generateCompareContent(host, guest, locale) };
}
