import type { Scene } from "@/components/illustrations/scene";
import { poleScenes } from "@/components/illustrations/pole-scenes";
import { pairScene, relationshipScenes } from "@/components/illustrations/moment-scenes";
import { typeScenes } from "@/components/illustrations/type-scenes";
import { isPersonalityType, type Letter, type Profile } from "@/lib/personality";

/** The letter this result leans on most clearly: chapter 02's cover shows its everyday picture. */
function clearestLetter(profile: Profile) {
  const index = profile.values.reduce((best, value, i) => (value > profile.values[best] ? i : best), 0);
  return profile.type[index] as Letter;
}

/**
 * Each chapter cover's picture, in order: 01 the type's own, 02 its clearest pole's, 03 two people,
 * 04 colleagues. The report's covers and a record's pages on `/my/report` both draw from here, so the
 * pages a record shows are the covers its report opens with.
 */
export function chapterScenes(profile: Profile): readonly (Scene | undefined)[] {
  return [
    isPersonalityType(profile.type) ? typeScenes[profile.type] : undefined,
    poleScenes[clearestLetter(profile)],
    pairScene,
    relationshipScenes.colleague,
  ];
}
