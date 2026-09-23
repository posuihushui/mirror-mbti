import Link from "next/link";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { MirrorMark, typeMirrorProfile } from "@/components/brand/mirror-mark";
import { trackAttrs, type CtaLocation } from "@/lib/analytics/events";
import { href, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { polesFor, typeMeta, type Letter } from "@/lib/personality";
import { preferenceDimensionsFor } from "@/lib/preference-content";
import { dimensions } from "@/lib/questionnaires";

/**
 * Explanatory diagrams for the type pages. They describe a type's preferences, not anyone's scores,
 * so they encode *which side*, never *how much*: the chosen pole is the one emphasised mark (warm),
 * everything else stays in the neutral ink scale. All text is real HTML in the server render.
 */

/** A type's temperament group on `/types`: intuitive types by their judgment letter, sensing types by their lifestyle letter. */
export function temperament(type: string) {
  return type[1] === "N" ? `N${type[2]}` : `S${type[3]}`;
}

/** Each pair as a two-ended line; the type's side is drawn from the centre to its end. */
export function DimensionSpectrum({ type, locale }: { type: string; locale: Locale }) {
  const t = pageMessages[locale].type;
  const poles = polesFor(locale);
  const dims = preferenceDimensionsFor(locale);
  return (
    <ol className="space-y-6">
      {dimensions.map((pair, i) => {
        const [first, second] = pair.split("") as Letter[];
        const chosen = type[i] as Letter;
        const left = chosen === first;
        return (
          <li key={pair}>
            <p className="text-xs text-mist">{`0${i + 1} · ${dims[i].title}`}</p>
            <div className="mt-2 flex items-baseline justify-between gap-3 text-sm" aria-hidden>
              <span className={left ? "font-medium text-ink" : "text-mist"}>{poles[first].label} {first}</span>
              <span className={left ? "text-mist" : "font-medium text-ink"}>{poles[second].label} {second}</span>
            </div>
            <p className="sr-only">{t.leansTo(poles[chosen].label, chosen)}</p>
            <div aria-hidden className="relative mt-2 h-3">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              <span className="absolute top-0.5 bottom-0.5 left-1/2 w-px bg-[#b9c5c9]" />
              <span className={cn("absolute top-1/2 h-0.5 -translate-y-1/2 bg-warm", left ? "right-1/2 left-1.5" : "right-1.5 left-1/2")} />
              <span className={cn("absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-warm ring-2 ring-card", left ? "left-0" : "right-0")} />
            </div>
            <p className="mt-3 text-sm font-medium">{poles[chosen].need}</p>
            <p className="mt-1 text-sm text-mist">{poles[chosen].strength}</p>
          </li>
        );
      })}
    </ol>
  );
}

/** Energy → information → judgment → planning, one everyday moment at each step. */
export function EverydayFlow({ type, locale, items }: { type: string; locale: Locale; items: string[] }) {
  const poles = polesFor(locale);
  const dims = preferenceDimensionsFor(locale);
  return (
    <ol className="grid gap-0 md:grid-cols-4">
      {items.map((text, i) => {
        const letter = type[i] as Letter;
        const last = i === items.length - 1;
        return (
          <li key={letter + i} className="relative flex gap-4 pb-6 md:block md:pr-6 md:pb-0">
            {/* The connector to the next step: down the left on phones, across on desktop. */}
            {!last && <span aria-hidden className="absolute top-11 bottom-1 left-5 w-px bg-line md:top-5 md:right-2 md:bottom-auto md:left-13 md:h-px md:w-auto" />}
            {!last && <ArrowDown aria-hidden size={14} className="absolute bottom-0 left-[13.5px] text-mist md:hidden" />}
            {!last && <ArrowRight aria-hidden size={14} className="absolute top-[13.5px] right-0 hidden text-mist md:block" />}
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-warm bg-card text-base font-medium">{letter}</span>
            <div className="min-w-0 md:mt-4">
              <p className="text-xs text-mist">{dims[i].title}</p>
              <p className="mt-1 text-sm font-medium">{poles[letter].label}</p>
              <p className="mt-2 text-sm text-slate">{text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** One correction per letter, each tagged with the letter it is about. */
export function MisconceptionList({ type, locale, items }: { type: string; locale: Locale; items: string[] }) {
  const poles = polesFor(locale);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((text, i) => {
        const letter = type[i] as Letter;
        return (
          <li key={letter + i} className="flex items-start gap-4 py-4">
            <span className="flex w-16 shrink-0 flex-col items-start pt-0.5">
              <span className="text-lg leading-none font-medium">{letter}</span>
              <span className="mt-1 text-xs text-mist">{poles[letter].label}</span>
            </span>
            <p className="min-w-0 text-base text-slate">{text}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** The example sentence as something said, with the advice that frames it. */
export function SayItBubble({ type, locale, line }: { type: string; locale: Locale; line: string }) {
  const t = pageMessages[locale].type;
  return (
    <figure>
      <blockquote className="relative max-w-xl rounded-[18px] rounded-bl-[4px] border border-line bg-card px-5 py-4 text-lg leading-heading">
        “{line}”
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-mist">
        <MirrorMark profile={typeMirrorProfile(type)} size={20} />
        {t.sayCaption(type)}
      </figcaption>
    </figure>
  );
}

/**
 * A sideways tree: the type on the left, its four one-letter neighbours branching to the right,
 * each branch labelled with the letter that flips and the dimension it belongs to.
 */
export function NeighborTree({ type, locale, neighbors, location }: { type: string; locale: Locale; neighbors: { dimension: string; type: string }[]; location: CtaLocation }) {
  const t = pageMessages[locale].type;
  const poles = polesFor(locale);
  const dims = preferenceDimensionsFor(locale);
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center">
      <div className="relative flex flex-col items-center gap-1.5 border border-ink bg-ink px-3 py-4 text-paper after:absolute after:top-1/2 after:-right-4 after:h-px after:w-4 after:bg-line md:px-4">
        <MirrorMark profile={typeMirrorProfile(type)} tone="paper" size={32} />
        <span className="text-lg font-medium tracking-tight">{type}</span>
      </div>
      <ul className="ml-4 list-none p-0">
        {neighbors.map(({ dimension, type: neighbor }) => {
          const index = dimensions.indexOf(dimension as (typeof dimensions)[number]);
          const from = type[index] as Letter;
          const to = neighbor[index] as Letter;
          const { name } = typeMeta(neighbor, locale);
          return (
            <li
              key={neighbor}
              className="relative py-1.5 pl-6 before:absolute before:top-1/2 before:left-0 before:h-px before:w-6 before:bg-line after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-line first:after:top-1/2 last:after:bottom-1/2"
            >
              <Link
                href={href(locale, `/types/${neighbor}`)}
                aria-label={t.neighborLabel(neighbor, name, poles[from].label, poles[to].label)}
                className="group flex items-center gap-3 border border-line bg-card px-3 py-2.5 transition-colors hover:border-[#9eacb0]"
                {...trackAttrs("view_type", location)}
              >
                <MirrorMark profile={typeMirrorProfile(neighbor)} size={28} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-tight font-medium tracking-tight">
                    {neighbor}
                    {locale === "zh" && <span className="ml-2 text-xs font-normal tracking-normal text-mist">{name}</span>}
                  </span>
                  <span className="mt-0.5 block text-xs text-mist"><span className="text-warm-ink">{from} → {to}</span> · {dims[index].title}</span>
                </span>
                <ArrowRight aria-hidden size={15} className="shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ROWS = ["IJ", "IP", "EP", "EJ"] as const;
const COLS = ["ST", "SF", "NF", "NT"] as const;

/**
 * The sixteen as one table: each row is a type's first and last letters (energy, planning), each
 * column its middle two (information, judgment). `current` and its neighbours are marked. It is a real
 * `<table>`, so a screen reader hears each type with its row and column.
 */
export function TypeMap({ locale, current, location }: { locale: Locale; current?: string; location: CtaLocation }) {
  const t = pageMessages[locale].types;
  const poles = polesFor(locale);
  const pairLabel = (pair: string) => `${poles[pair[0] as Letter].label} · ${poles[pair[1] as Letter].label}`;
  const oneApart = (type: string) => !!current && [...type].filter((letter, i) => letter !== current[i]).length === 1;
  return (
    <figure>
      <table className="w-full table-fixed border-separate border-spacing-1.5 md:border-spacing-2">
        <caption className="sr-only">{t.mapNote}</caption>
        <colgroup>
          <col className="w-10 md:w-28" />
          <col span={4} />
        </colgroup>
        <thead>
          <tr>
            <td />
            {COLS.map((col) => (
              <th key={col} scope="col" className="pb-1 align-bottom font-normal">
                <span className="block text-sm font-medium">{col}</span>
                {/* English labels are long; phones keep the letters, which the caption explains. */}
                <span className={cn("block text-xs text-mist", locale === "en" && "hidden md:block")}>{pairLabel(col)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <th scope="row" className="pr-1 text-left align-middle font-normal md:pr-3">
                <span className="block text-sm font-medium">{row}</span>
                <span className="hidden text-xs text-mist md:block">{pairLabel(row)}</span>
              </th>
              {COLS.map((col) => {
                const type = `${row[0]}${col}${row[1]}`;
                const here = type === current;
                const near = oneApart(type);
                const { name } = typeMeta(type, locale);
                return (
                  <td key={type} className="p-0">
                    <Link
                      href={href(locale, `/types/${type}`)}
                      aria-label={locale === "zh" ? `${type} ${name}` : type}
                      aria-current={here ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-16 flex-col items-center justify-center gap-1 border px-1 py-2 transition-colors md:min-h-20",
                        here ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-[#9eacb0]",
                        near && "border-warm",
                      )}
                      {...trackAttrs("view_type", location)}
                    >
                      <MirrorMark profile={typeMirrorProfile(type)} tone={here ? "paper" : "ink"} size={24} />
                      <span className="text-sm font-medium tracking-tight md:text-base">{type}</span>
                      {locale === "zh" && <span className={cn("hidden text-xs md:block", here ? "text-night-body" : "text-mist")}>{name}</span>}
                      {near && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-warm" />}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 flex flex-col gap-2 text-xs text-mist md:flex-row md:items-center md:justify-between">
        <span aria-hidden>{t.mapNote}</span>
        {current && (
          <span className="flex shrink-0 items-center gap-4">
            <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 bg-ink" />{t.mapCurrent}</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 border border-warm" />{t.mapNeighbor}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** The type spelled out: each letter over the preference it stands for. */
export function LetterBreakdown({ type, locale }: { type: string; locale: Locale }) {
  const poles = polesFor(locale);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label={type}>
      {(type.split("") as Letter[]).map((letter) => (
        <li key={letter} className="flex flex-col items-center gap-1 border border-night-line px-1 py-3 text-center">
          <span className="text-3xl leading-none font-medium">{letter}</span>
          <span className="text-xs text-night-body">{poles[letter].label}</span>
        </li>
      ))}
    </ol>
  );
}
