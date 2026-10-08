import { cn } from "cn";
import type { Locale } from "@/lib/i18n/locale";
import { reportMessages } from "@/lib/i18n/messages/report";
import { clarityOf, type Clarity } from "@/lib/personality";
import { degreeLabelsFor } from "@/lib/preference-content";
import type { Insight, InsightDimension } from "@/lib/report-content";

/**
 * The report's small charts. They say with a shape what the report used to repeat in sentences: how
 * clearly a dimension leans, where it falls among the four bands, and which strength and blind spot
 * belong to the same lean. Every chart states its reading in text for screen readers; the shapes
 * themselves are `aria-hidden`. They show this answer's lean, never a score of ability.
 */

const LEVEL: Record<Clarity, number> = { even: 1, balanced: 2, slight: 3, marked: 4 };
const near = (clarity: Clarity) => clarity === "even" || clarity === "balanced";

/** The lean a passage reads from, as a four-step signal: the letter, the bars, the band's name. */
export function ClarityMeter({ dim, className }: { dim: InsightDimension; className?: string }) {
  const level = LEVEL[dim.clarity];
  const balanced = near(dim.clarity);
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap", balanced ? "text-warm-ink" : "text-mist", className)}>
      <span className="font-medium text-ink">{dim.letter}</span>
      <span aria-hidden className="flex h-3 items-end gap-[2px]">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cn("w-[3px] rounded-[1px]", step <= level ? (balanced ? "bg-warm" : "bg-ink") : "bg-line")} style={{ height: 3 + step * 2 }} />
        ))}
      </span>
      {dim.degree}
    </span>
  );
}

/** Where a band starts on a 50–100 lean: even to 55, balanced to 60, slight to 75, then marked. */
const BANDS: { clarity: Clarity; from: number; to: number; tone: string }[] = [
  { clarity: "even", from: 50, to: 55, tone: "bg-[#e1e8ea]" },
  { clarity: "balanced", from: 55, to: 60, tone: "bg-[#d1dbde]" },
  { clarity: "slight", from: 60, to: 75, tone: "bg-[#bfcdd1]" },
  { clarity: "marked", from: 75, to: 100, tone: "bg-[#a9bac0]" },
];
const along = (value: number) => Math.min(Math.max((value - 50) * 2, 0), 100);

/** The four bands named once, lightest first, above the needs that use them. */
export function LeanBandsLegend({ locale }: { locale: Locale }) {
  const labels = degreeLabelsFor(locale);
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist">
      <span>{reportMessages[locale].one.bandsLabel}</span>
      {BANDS.map((band) => (
        <span key={band.clarity} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2.5 rounded-[2px]", band.tone)} />
          {labels[band.clarity]}
        </span>
      ))}
    </p>
  );
}

/** One lean on the shaded bands: how far this answer went toward its side, from even (left) to marked (right). */
export function LeanBands({ value, label, className }: { value: number; label: string; className?: string }) {
  const band = clarityOf(value);
  return (
    <div role="img" aria-label={label} className={cn("relative h-3", className)}>
      <div aria-hidden className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-full">
        {BANDS.map((b) => <span key={b.clarity} className={b.tone} style={{ width: `${b.to * 2 - b.from * 2}%` }} />)}
      </div>
      <span aria-hidden className={cn("absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card", near(band) ? "bg-warm" : "bg-ink")} style={{ left: `clamp(7px, ${along(value)}%, calc(100% - 7px))` }} />
    </div>
  );
}

/**
 * Chapter 02 at a glance: each strength opposite the blind spot of the same lean, as a butterfly
 * chart. The bars grow with the lean, since the clearer it is, the more easily its strength comes
 * and the easier the other end is to miss. A near-even pair keeps both bars short.
 */
export function StrengthBlindspotChart({ strengths, blindspots, locale }: { strengths: Insight[]; blindspots: Insight[]; locale: Locale }) {
  const t = reportMessages[locale].two;
  return (
    <figure data-strength-chart className="bg-card p-5 md:p-6">
      <p className="text-base font-medium">{t.chartTitle}</p>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] gap-x-3 text-xs">
        <span className="text-right text-warm-ink">{t.strengthSide}</span>
        <span />
        <span className="text-mist">{t.blindSide}</span>
      </div>
      <ol className="mt-2 space-y-4">
        {strengths.map((strength, i) => {
          const blindspot = blindspots[i];
          const dim = strength.dim;
          const width = !dim || near(dim.clarity) ? 14 : Math.max(18, along(dim.value));
          return (
            <li key={strength.title} className="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-x-3">
              <span className="min-w-0 text-right">
                <span className="block text-sm leading-snug">{strength.title}</span>
                <span aria-hidden className="mt-1.5 ml-auto block h-1.5 rounded-full bg-warm" style={{ width: `${width}%` }} />
              </span>
              <span className="flex size-8 items-center justify-center rounded-full border border-line bg-paper text-sm font-medium">
                {dim?.letter}
                {dim && <span className="sr-only"> · {dim.degree}</span>}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-snug text-slate">{blindspot.title}</span>
                <span aria-hidden className="mt-1.5 block h-1.5 rounded-full bg-[#b9c5c9]" style={{ width: `${width}%` }} />
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-5 text-xs text-mist">{t.chartCaption}</figcaption>
    </figure>
  );
}

/**
 * Chapter 03's moment between two people on its dimension's line: you a filled dot at your side,
 * the other a warm ring at the opposite end. A near-even reader sits in the middle, alone: the
 * moment is about how this dimension shifts, not about someone opposite.
 */
export function PairDots({ dim, balanced, locale }: { dim: InsightDimension; balanced: boolean; locale: Locale }) {
  const t = reportMessages[locale].three;
  const [first, second] = dim.dimension.split("");
  const you = balanced ? 50 : dim.letter === first ? 8 : 92;
  const them = dim.letter === first ? 92 : 8;
  const dot = (left: number, label: string, filled: boolean) => (
    <span className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${left}%` }}>
      <span className={filled ? "mt-[5px] size-3 rounded-full bg-ink ring-2 ring-card" : "mt-[5px] size-3 rounded-full border-2 border-warm bg-card"} />
      <span className="mt-1 text-xs text-mist">{label}</span>
    </span>
  );
  return (
    <div aria-hidden className="mt-2">
      <div className="flex justify-between text-xs text-mist"><span>{first}</span><span>{second}</span></div>
      <div className="relative mt-0.5 h-9">
        <span className="absolute inset-x-0 top-[10px] h-px bg-line" />
        <span className="absolute top-[6px] left-1/2 h-2 w-px bg-[#b9c5c9]" />
        {!balanced && dot(them, t.them, false)}
        {dot(you, t.you, true)}
      </div>
    </div>
  );
}
