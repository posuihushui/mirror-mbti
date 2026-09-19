import type { CompareContent } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { CompareReveal } from "./compare-reveal";

/** Render frozen content as supplied. v1 is never regenerated to look like v2. */
export function ComparisonReading({ content, locale, compact = false, animate = true }: {
  content: CompareContent;
  locale: Locale;
  /** Benefit cards show the same second and third sections as the complete guide. */
  compact?: boolean;
  animate?: boolean;
}) {
  const m = compareMessages[locale];
  const sections = content.sections.map((section, index) => {
    if (compact && index === 0) return null;
    const openingLine = content.contentVersion === "compare-v2" ? section.openingLine : undefined;
    return <section key={index} data-compare-motion="section" className="border-t border-line py-6">
      <p aria-hidden="true" className="mb-3 text-[10px] tracking-[.14em] text-[#c49473]">0{index + 1}</p>
      <h2 className="text-xl leading-[1.4]">{section.title}</h2>
      <p className="mt-4 text-sm leading-[1.8]">{section.body}</p>
      {openingLine && <div className="mt-5 border-l border-[#c49473] pl-4">
        <p className="mb-2 text-xs text-mist">{m.openingLineLabel}</p>
        <blockquote className="text-sm leading-[1.8]">{openingLine}</blockquote>
      </div>}
      {section.practice && <div className="mt-4 border-l border-[#c49473] pl-4 text-sm leading-[1.8]">
        {content.contentVersion === "compare-v2" && <p className="mb-2 text-xs text-mist">{m.practiceLabel}</p>}
        <p>{section.practice}</p>
      </div>}
    </section>;
  });
  return <div data-compare-reading={content.contentVersion}>
    {content.differentQuestionnaires && <p className="mb-6 text-xs leading-[1.8] text-mist">{m.differentQuestionnaires}</p>}
    {animate ? <CompareReveal mode="sections">{sections}</CompareReveal> : <div className="space-y-6">{sections}</div>}
    {!compact && <p className="mt-6 text-xs leading-[1.8] text-mist">{m.note}</p>}
  </div>;
}
