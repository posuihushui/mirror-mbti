import { compareMessages } from "@/lib/i18n/messages/compare";
import type { Locale } from "@/lib/i18n/locale";
import {
  COMPARE_CONTENT_VERSION, COMPARE_DIMENSION_ORDER,
  type CompareCategories, type CompareDimension, type CompareDimensionCard, type CompareOutputSnapshotV3,
  type CompareRelation, type CompareSnapshot,
} from "@/lib/compare-types";

type CompareCards = [CompareDimensionCard, CompareDimensionCard, CompareDimensionCard, CompareDimensionCard];
type ComparePole = Exclude<CompareCategories[CompareDimension], "balanced">;

export function compareRelation<D extends CompareDimension>(
  dimension: D, host: CompareCategories[D], guest: CompareCategories[D],
): CompareRelation {
  if (host === "balanced" || guest === "balanced") return "includes-balanced";
  if (host !== guest) return "opposite";
  return host === dimension[0] ? "same-left" : "same-right";
}

/**
 * Pure, deterministic output. Persist this output; do not recalculate historical pairs on read.
 * Every dimension produces a card, so all four consented categories reach the reading, and one
 * of them carries the emphasis. Wording stays role-symmetric: the two readers share one row.
 */
export function generateCompareContent(
  host: CompareSnapshot, guest: CompareSnapshot, locale: Locale = "zh",
): CompareOutputSnapshotV3 {
  const copy = compareMessages[locale];
  const cards = COMPARE_DIMENSION_ORDER.map((dimension): CompareDimensionCard => {
    const relation = compareRelation(dimension, host.categories[dimension], guest.categories[dimension]);
    return {
      dimension,
      relation,
      body: relation === "opposite" ? copy.opposite[dimension]
        : relation === "includes-balanced" ? copy.contextual[dimension]
          : copy.same[host.categories[dimension] as ComparePole],
      scene: copy.scenes[dimension][relation],
    };
  }) as CompareCards;
  const opposite = cards.find(({ relation }) => relation === "opposite");
  const balanced = cards.find(({ relation }) => relation === "includes-balanced");
  const allBalanced = COMPARE_DIMENSION_ORDER.every((dimension) => host.categories[dimension] === "balanced" && guest.categories[dimension] === "balanced");
  // Nothing is determinate when every dimension is near-balanced, so no single one is singled out.
  const emphasis = allBalanced ? undefined : opposite?.dimension ?? balanced?.dimension;
  return {
    contentVersion: COMPARE_CONTENT_VERSION,
    locale,
    differentQuestionnaires: host.questionnaireId !== guest.questionnaireId,
    highlight: {
      ...(emphasis ? { dimension: emphasis } : {}),
      body: opposite ? copy.highlights.opposite[opposite.dimension]
        : allBalanced ? copy.highlights.allContextual
          : balanced ? copy.highlights.contextual
            : copy.highlights.similar,
      openingLine: emphasis ? copy.openingLines[emphasis] : copy.genericOpeningLine,
    },
    cards,
    practice: emphasis ? copy.practices[emphasis] : copy.genericPractice,
  };
}
