import { cn } from "cn";
import { MirrorMark, type MirrorProfile } from "@/components/brand/mirror-mark";
import type { CompareCategories } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";

/*
 * The two halves of a guide for two, drawn: shared by the report's guide tab, the sample, the
 * invitation sheet (a client island) and the invitation page. No icons here, so it renders on both sides.
 */

type Dimension = keyof CompareCategories;
const DIMENSIONS = ["EI", "SN", "TF", "JP"] as const satisfies readonly Dimension[];

/** The midpoint mark: the brand's own mirror, standing in for someone not yet here. */
const unknown: MirrorProfile = { type: "ESTJ", values: [50, 50, 50, 50] };

/** Two mirrors facing each other: the known one, and the other once it exists (a faint stand-in until then). */
export function PairMarks({ you, partner, labels, size, className }: { you: MirrorProfile; partner: MirrorProfile | null; labels: [string, string]; size: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3", className)}>
      <span className="flex flex-col items-center gap-1.5">
        <MirrorMark profile={you} size={size} />
        <span className="text-xs text-mist">{labels[0]}</span>
      </span>
      <span className="relative -mt-5 h-px w-10 border-t border-dashed border-warm md:w-14">
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm" />
      </span>
      <span className="flex flex-col items-center gap-1.5">
        <MirrorMark profile={partner ?? unknown} size={size} className={partner ? undefined : "opacity-25"} />
        <span className="text-xs text-mist">{labels[1]}</span>
      </span>
    </div>
  );
}

/** Where a category sits on its pair's line, as the guide places it: a side's end, or the middle. */
function position(category: string, dimension: string) {
  return category === dimension[0] ? 6 : category === dimension[1] ? 94 : 50;
}

/** The categories as words, for the sentence that stands in for the drawing. */
export function categoryNames(locale: Locale, categories: CompareCategories) {
  const c = compareMessages[locale];
  return DIMENSIONS.map((dimension) => c.categoryLabels[categories[dimension]]).join(locale === "en" ? ", " : "、");
}

/**
 * The guide's four lines, one row for you and one for them. A row not yet answered stays dashed with
 * a question mark, so the figure shows what the missing answers would add. Sides only, never strength,
 * the same as the guide itself. You are a filled dot and they are a warm ring, as in the guide.
 * The report passes the reader as `you`; the invitation page passes the host as `them`, leads with
 * their row (`first`) and leaves the reader's open, with its own sentence and caption.
 */
export function PairLines({ locale, you, them, sr, caption, first = "you" }: { locale: Locale; you: CompareCategories | null; them: CompareCategories | null; sr?: string; caption?: string; first?: "you" | "them" }) {
  const c = compareMessages[locale];
  const t = pairingUiMessages[locale].reportInvite;
  const row = (who: "you" | "them", category: string | null, dimension: Dimension) => (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center">
      <span className="text-xs text-mist">{who === "you" ? t.you : t.them}</span>
      <span className="relative h-5">
        {category
          ? <>
              <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
              <span className="absolute top-1/2 left-1/2 h-2 w-px -translate-y-1/2 bg-line" />
              <span
                className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full", who === "them" ? "border-2 border-warm bg-card" : "bg-ink ring-2 ring-card")}
                style={{ left: `${position(category, dimension)}%` }}
              />
            </>
          : <>
              <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-mist/50" />
              <span className="absolute top-1/2 left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-warm-ink bg-card text-xs text-warm-ink">?</span>
            </>}
      </span>
    </div>
  );
  const sentence = sr ?? (you && them ? t.lines.srKnown(categoryNames(locale, you), categoryNames(locale, them)) : you ? t.lines.sr(categoryNames(locale, you)) : "");
  return (
    <figure data-pair-lines>
      {sentence && <p className="sr-only">{sentence}</p>}
      <div aria-hidden className="grid grid-cols-2 gap-x-5 gap-y-6 md:gap-x-10">
        {DIMENSIONS.map((dimension) => (
          <div key={dimension} className="min-w-0">
            <p className="text-sm font-medium">{c.themes[dimension]}</p>
            <div className="mt-2 flex justify-between gap-2 pl-[2.75rem] text-xs text-mist">
              <span><span className="hidden md:inline">{c.categoryLabels[dimension[0] as keyof typeof c.categoryLabels]} </span>{dimension[0]}</span>
              <span><span className="hidden md:inline">{c.categoryLabels[dimension[1] as keyof typeof c.categoryLabels]} </span>{dimension[1]}</span>
            </div>
            <div className="mt-1 space-y-1">
              {(first === "you" ? ["you", "them"] as const : ["them", "you"] as const).map((who) => <div key={who}>{row(who, (who === "you" ? you : them)?.[dimension] ?? null, dimension)}</div>)}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-5 text-sm text-mist">{caption ?? (them ? t.lines.legendKnown : t.lines.legend)}</figcaption>
    </figure>
  );
}
