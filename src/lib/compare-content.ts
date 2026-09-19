import { compareMessages } from "@/lib/i18n/messages/compare";
import type { Locale } from "@/lib/i18n/locale";
import {
  COMPARE_CONTENT_VERSION, COMPARE_DIMENSION_ORDER,
  type CompareCategories, type CompareDimension, type CompareOutputSnapshotV2,
  type CompareRelation, type CompareSnapshot,
} from "@/lib/compare-types";

export function compareRelation<D extends CompareDimension>(
  dimension: D, host: CompareCategories[D], guest: CompareCategories[D],
): CompareRelation {
  if (host === "balanced" || guest === "balanced") return "includes-balanced";
  if (host !== guest) return "opposite";
  return host === dimension[0] ? "same-left" : "same-right";
}

/** Pure, deterministic output. Persist this output; do not recalculate historical pairs on read. */
export function generateCompareContent(
  host: CompareSnapshot, guest: CompareSnapshot, locale: Locale = "zh",
): CompareOutputSnapshotV2 {
  const copy = compareMessages[locale];
  const relations = COMPARE_DIMENSION_ORDER.map((dimension) => ({
    dimension,
    relation: compareRelation(dimension, host.categories[dimension], guest.categories[dimension]),
  }));
  const same = relations.find(({ relation }) => relation === "same-left" || relation === "same-right");
  const opposite = relations.find(({ relation }) => relation === "opposite");
  const balanced = relations.find(({ relation }) => relation === "includes-balanced");
  const commonPole = same && host.categories[same.dimension];
  const allBalanced = relations.every(({ dimension }) => host.categories[dimension] === "balanced" && guest.categories[dimension] === "balanced");
  const practiceDimension = allBalanced ? undefined : opposite?.dimension ?? balanced?.dimension;
  return {
    contentVersion: COMPARE_CONTENT_VERSION,
    locale,
    differentQuestionnaires: host.questionnaireId !== guest.questionnaireId,
    sections: [
      {
        title: copy.titles[0],
        body: commonPole && commonPole !== "balanced"
          ? copy.same[commonPole]
          : balanced ? copy.balancedCommon : copy.oppositeCommon,
      },
      {
        title: copy.titles[1],
        body: opposite ? copy.opposite[opposite.dimension]
          : balanced ? copy.balancedDifference : copy.sameDifference,
      },
      {
        title: copy.titles[2],
        body: !opposite && balanced ? copy.balancedPracticeBody : copy.practiceBody,
        openingLine: practiceDimension ? copy.openingLines[practiceDimension] : copy.genericOpeningLine,
        practice: practiceDimension ? copy.practices[practiceDimension] : copy.genericPractice,
      },
    ],
  };
}
