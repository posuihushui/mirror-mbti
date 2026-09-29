import { Illustration } from "@/components/illustrations/scene";
import { relationshipScenes } from "@/components/illustrations/moment-scenes";
import { COMPARE_RELATIONSHIPS } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";

/**
 * The same difference in the four relationships: each pictured by the moment its example is about
 * (the anniversary, the weekend, the trip home, the deadline), with that scene and the topic the
 * relationship's guide adds. Scenes and topic titles only, never a reading.
 */
export function RelationshipCards({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const c = compareMessages[locale];
  return (
    <ul className={compact ? "grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"}>
      {COMPARE_RELATIONSHIPS.map((relationship) => (
        <li key={relationship} data-relationship={relationship} className={compact ? "rounded-[4px] border border-line bg-card p-3 md:p-4" : "rounded-[4px] border border-line bg-card p-5"}>
          <Illustration scene={relationshipScenes[relationship]} className={compact ? "mx-auto mb-2 w-full max-w-36" : "mx-auto mb-3 w-full max-w-48"} />
          <p className="text-base font-medium">{c.relationshipLabels[relationship]}</p>
          <p className={compact ? "mt-2 border-l-2 border-warm pl-2.5 text-xs" : "mt-3 border-l-2 border-warm pl-3 text-sm"}>{c.byRelationship[relationship].scenes.JP.opposite}</p>
          <p className={compact ? "mt-3 text-xs text-mist" : "mt-4 text-xs text-mist"}>{c.topicLabels[relationship]}</p>
          <p className={compact ? "mt-0.5 text-xs font-medium" : "mt-1 text-sm font-medium"}>{c.byRelationship[relationship].topic.title}</p>
        </li>
      ))}
    </ul>
  );
}
