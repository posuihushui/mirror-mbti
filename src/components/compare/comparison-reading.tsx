import type { CompareCategories, CompareContent, CompareDimensionCard, CompareOutputSnapshotV3 } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { CompareReveal } from "./compare-reveal";
import styles from "./compare-motion.module.css";
import { SurfaceMark } from "@/components/brand/surface-mark";

/** Which two people this reading is rendered for; presentation only, never part of the frozen content. */
export type CompareSides = { you: CompareCategories; other: CompareCategories; youLabel: string; otherLabel: string };

type ReadingProps = {
  content: CompareContent;
  locale: Locale;
  /** Previews show the emphasis and a single card, never the complete four-card reading. */
  compact?: boolean;
  animate?: boolean;
  sides?: CompareSides;
};

function DimensionCard({ card, locale, sides }: { card: CompareDimensionCard; locale: Locale; sides?: CompareSides }) {
  const m = compareMessages[locale];
  const mark = card.relation === "opposite" ? styles.markOpposite : card.relation === "includes-balanced" ? styles.markContextual : styles.markSame;
  return <li data-compare-motion="section" data-compare-card={card.dimension} className="rounded-[4px] border border-line bg-card p-5 md:p-6">
    <p className="flex items-center gap-3">
      <span aria-hidden="true" className="text-[22px] leading-none tracking-[.06em] text-mist">{card.dimension}</span>
      <span aria-hidden="true" className={mark} />
      <span className="text-[11px] leading-[1.6]">{m.relationLabels[card.relation]}</span>
    </p>
    <h3 className="mt-4 text-[17px] leading-[1.5] font-medium">{m.themes[card.dimension]}</h3>
    {sides && <p className="mt-2 text-xs leading-[1.7] text-mist">{sides.youLabel} {m.categoryLabels[sides.you[card.dimension]]} · {sides.otherLabel} {m.categoryLabels[sides.other[card.dimension]]}</p>}
    <p className="mt-3 text-sm leading-[1.9]">{card.body}</p>
    <p className="mt-4 bg-[#ead9cc] p-4 text-[13px] leading-[1.8] text-ink"><span className="eyebrow mr-2 inline-block opacity-65">{m.sceneLabel}</span>{card.scene}</p>
  </li>;
}

/** One emphasis, four dimension cards, one shared practice. */
function Reading({ content, locale, compact, sides }: ReadingProps & { content: CompareOutputSnapshotV3 }) {
  const m = compareMessages[locale];
  const emphasised = content.cards.find(({ dimension }) => dimension === content.highlight.dimension) ?? content.cards[0];
  const cards = compact ? [emphasised] : content.cards;
  return <>
    <section data-compare-motion="section" className="surface-texture surface-texture-dark relative overflow-hidden rounded-[4px] bg-night p-6 text-paper md:p-8">
      <SurfaceMark className="-right-24 -bottom-24 opacity-[0.06]" />
      <div className="surface-content">
      <p className="eyebrow text-warm">{m.highlightLabel}</p>
      {content.highlight.dimension && <h2 className="mt-5 text-3xl leading-tight md:text-4xl">{m.themes[content.highlight.dimension]}</h2>}
      <p className="mt-5 text-[15px] leading-8 text-[#cbd6d8]">{content.highlight.body}</p>
      <div className="mt-6 border-l border-warm pl-4 md:pl-5">
        <p className="mb-2 text-xs leading-[1.7] text-[#8d9ca1]">{m.openingLineLabel}</p>
        <blockquote className="text-lg leading-8 md:text-xl">{content.highlight.openingLine}</blockquote>
      </div>
      </div>
    </section>
    <section>
      <h2 className="eyebrow text-mist">{compact ? m.moreDimensions : m.cardsTitle}</h2>
      <ol className={`mt-4 grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>{cards.map((card) => <DimensionCard key={card.dimension} card={card} locale={locale} sides={sides} />)}</ol>
    </section>
    {!compact && <section data-compare-motion="section" className="warm-panel p-6 md:p-8">
      <p className="eyebrow opacity-65">{m.practiceLabel}</p>
      <p className="mt-3 text-[17px] leading-[1.8]">{content.practice}</p>
    </section>}
  </>;
}

/** Render frozen content as supplied. v1 and v2 are never regenerated to look like v3. */
function StoredSections({ content, locale, compact }: ReadingProps & { content: Exclude<CompareContent, CompareOutputSnapshotV3> }) {
  const m = compareMessages[locale];
  return <>{content.sections.map((section, index) => {
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
  })}</>;
}

export function ComparisonReading({ content, locale, compact = false, animate = true, sides }: ReadingProps) {
  const m = compareMessages[locale];
  const v3 = content.contentVersion === "compare-v3";
  const blocks = v3
    ? <Reading content={content} locale={locale} compact={compact} sides={sides} />
    : <StoredSections content={content} locale={locale} compact={compact} />;
  // A v3 reading leads with its emphasis, so the questionnaire caveat joins the closing notes;
  // stored v1 and v2 readings keep the caveat where they have always carried it.
  const caveat = content.differentQuestionnaires && <p className="text-xs leading-[1.8] text-mist">{m.differentQuestionnaires}</p>;
  return <div data-compare-reading={content.contentVersion}>
    {!v3 && caveat && <div className="mb-6">{caveat}</div>}
    {animate ? <CompareReveal mode="sections">{blocks}</CompareReveal> : <div className="space-y-6">{blocks}</div>}
    {!compact && <div className="mt-6 space-y-2">{v3 && caveat}<p className="text-xs leading-[1.8] text-mist">{m.note}</p></div>}
    {compact && v3 && caveat && <div className="mt-6">{caveat}</div>}
  </div>;
}
