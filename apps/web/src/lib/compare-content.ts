import { compareMessages } from "@/lib/i18n/messages/compare";
import type { Locale } from "@/lib/i18n/locale";
import {
  COMPARE_CONTENT_VERSION, COMPARE_DIMENSION_ORDER, COMPARE_V3_CONTENT_VERSION,
  type CompareCategories, type CompareDimension, type CompareDimensionCard, type CompareOutputSnapshotV3,
  type CompareOutputSnapshotV4, type CompareRelation, type CompareRelationship, type CompareSnapshot,
} from "@/lib/compare-types";

type CompareCards = [CompareDimensionCard, CompareDimensionCard, CompareDimensionCard, CompareDimensionCard];
type ComparePole = Exclude<CompareCategories[CompareDimension], "balanced">;
type Scenes = Record<CompareDimension, Record<CompareRelation, string>>;

export function compareRelation<D extends CompareDimension>(
  dimension: D, host: CompareCategories[D], guest: CompareCategories[D],
): CompareRelation {
  if (host === "balanced" || guest === "balanced") return "includes-balanced";
  if (host !== guest) return "opposite";
  return host === dimension[0] ? "same-left" : "same-right";
}

/**
 * What both versions share: a card per dimension (with the scenes of the given copy), the emphasis
 * and the highlight body. Wording stays role-symmetric: the two readers share one row.
 */
function reading(host: CompareSnapshot, guest: CompareSnapshot, locale: Locale, scenes: Scenes) {
  const copy = compareMessages[locale];
  const cards = COMPARE_DIMENSION_ORDER.map((dimension): CompareDimensionCard => {
    const relation = compareRelation(dimension, host.categories[dimension], guest.categories[dimension]);
    return {
      dimension,
      relation,
      body: relation === "opposite" ? copy.opposite[dimension]
        : relation === "includes-balanced" ? copy.contextual[dimension]
          : copy.same[host.categories[dimension] as ComparePole],
      scene: scenes[dimension][relation],
    };
  }) as CompareCards;
  const opposite = cards.find(({ relation }) => relation === "opposite");
  const balanced = cards.find(({ relation }) => relation === "includes-balanced");
  const allBalanced = COMPARE_DIMENSION_ORDER.every((dimension) => host.categories[dimension] === "balanced" && guest.categories[dimension] === "balanced");
  // Nothing is determinate when every dimension is near-balanced, so no single one is singled out.
  const emphasis = allBalanced ? undefined : opposite?.dimension ?? balanced?.dimension;
  const body = opposite ? copy.highlights.opposite[opposite.dimension]
    : allBalanced ? copy.highlights.allContextual
      : balanced ? copy.highlights.contextual
        : copy.highlights.similar;
  return { cards, emphasis, body, differentQuestionnaires: host.questionnaireId !== guest.questionnaireId };
}

/**
 * Pure, deterministic output. Persist this output; do not recalculate historical pairs on read.
 * Every dimension produces a card, so all four consented categories reach the reading, and one
 * of them carries the emphasis. Joins to invitations that name no relationship still use it.
 */
export function generateCompareContent(
  host: CompareSnapshot, guest: CompareSnapshot, locale: Locale = "zh",
): CompareOutputSnapshotV3 {
  const copy = compareMessages[locale];
  const { cards, emphasis, body, differentQuestionnaires } = reading(host, guest, locale, copy.scenes);
  return {
    contentVersion: COMPARE_V3_CONTENT_VERSION,
    locale,
    differentQuestionnaires,
    highlight: {
      ...(emphasis ? { dimension: emphasis } : {}),
      body,
      openingLine: emphasis ? copy.openingLines[emphasis] : copy.genericOpeningLine,
    },
    cards,
    practice: emphasis ? copy.practices[emphasis] : copy.genericPractice,
  };
}

/**
 * v4: the same analysis written for one relationship. Card bodies and the highlight stay shared;
 * scenes, the opening line, the practice and the relationship's topic come from its own copy.
 */
export function generateRelationshipContent(
  host: CompareSnapshot, guest: CompareSnapshot, relationship: CompareRelationship, locale: Locale = "zh",
): CompareOutputSnapshotV4 {
  const own = compareMessages[locale].byRelationship[relationship];
  const { cards, emphasis, body, differentQuestionnaires } = reading(host, guest, locale, own.scenes);
  return {
    contentVersion: COMPARE_CONTENT_VERSION,
    locale,
    differentQuestionnaires,
    relationship,
    highlight: {
      ...(emphasis ? { dimension: emphasis } : {}),
      body,
      openingLine: emphasis ? own.openingLines[emphasis] : own.genericOpeningLine,
    },
    cards,
    topic: { title: own.topic.title, body: emphasis ? own.topic.bodies[emphasis] : own.topic.generic },
    practice: emphasis ? own.practices[emphasis] : own.genericPractice,
  };
}
