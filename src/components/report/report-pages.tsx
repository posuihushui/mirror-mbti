import type { ReactNode } from "react";
import Link from "next/link";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { Illustration } from "@/components/illustrations/scene";
import { trackAttrs } from "@/lib/analytics/events";
import { href, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import type { Profile } from "@/lib/personality";
import { chapterLabelsFor } from "@/lib/site";
import { chapterScenes } from "./chapter-scenes";
import { LockedPage } from "./locked-page";

/** The test result, then the report's four chapters. */
const PAGE_COUNT = 5;

/** How many of a record's pages are open, beside its date: 1 / 5 or 5 / 5. The list itself names it for screen readers. */
export function PagesCount({ unlocked }: { unlocked: boolean }) {
  return (
    <span aria-hidden className="ml-auto text-xs text-mist">
      <span className="text-sm font-medium text-ink">{unlocked ? PAGE_COUNT : 1}</span> / {PAGE_COUNT}
    </span>
  );
}

/**
 * A record on `/my/report` shows its report as five pages (owner request, 2026-09-29: unlocked and locked
 * records looked alike, and a locked one should feel unfinished without saying "pay"). The first page is
 * the test result, with the record's mark. An unlocked report's four pages are the dark covers its chapters
 * open with, each opening its chapter. A locked report's are the same covers, looping as they do
 * everywhere, under frosted glass with a lock: enough shows through to see there is a picture, not enough
 * to see it whole. Hovering one (a first tap on phones) says what it holds and that unlocking opens it.
 * Only pictures are shown, never a passage, and nothing here names a price.
 */
export function ReportPages({ id, profile, unlocked, locale }: { id: string; profile: Profile; unlocked: boolean; locale: Locale }) {
  const t = pageMessages[locale].history.pages;
  const labels = chapterLabelsFor(locale);
  const scenes = chapterScenes(profile);
  return (
    <ol aria-label={t.label(unlocked ? PAGE_COUNT : 1)} className="mt-5 grid grid-cols-5 gap-1.5 md:mt-6 md:grid-cols-[repeat(5,7.75rem)] md:gap-3">
      <li>
        <Link href={href(locale, `/result/${id}`)} prefetch={false} aria-label={t.result} className="block" {...trackAttrs("view_result", "history_pages")}>
          <span className="flex aspect-[3/4] items-center justify-center border border-line bg-white/50">
            <MirrorMark profile={profile} size={64} className="h-auto w-1/2" />
          </span>
          <PageLabel short={t.resultShort} full={t.result} open />
        </Link>
      </li>
      {labels.map((label, i) => {
        const scene = scenes[i];
        const number = <span className="absolute top-1.5 left-1.5 z-10 text-xs leading-none text-night-mist md:top-2 md:left-2">{String(i + 1).padStart(2, "0")}</span>;
        return (
          <li key={label}>
            {unlocked ? (
              <Link href={href(locale, `/report/${id}?chapter=${i + 1}`)} prefetch={false} aria-label={t.read(label)} className="block" {...trackAttrs("read_report", "history_pages")}>
                <Page>
                  {number}
                  {scene && <Illustration scene={scene} tone="night" className="w-[84%]" />}
                </Page>
                <PageLabel short={t.short[i]} full={label} open />
              </Link>
            ) : (
              <LockedPage
                href={href(locale, `/result/${id}?unlock=1`)}
                label={t.lockedLabel(label)}
                chapter={`${String(i + 1).padStart(2, "0")} · ${label}`}
                note={t.locked}
                align={i === labels.length - 1 ? "end" : "center"}
                track={trackAttrs("unlock_report", "history_pages")}
              >
                <Page frosted>
                  {number}
                  {scene && <Illustration scene={scene} tone="night" className="w-[84%] blur-[0.6px] md:blur-[1.5px]" />}
                  {/* In the corner, so the picture shows through the glass. */}
                  <span className="absolute top-1 right-1 z-10 flex size-5 items-center justify-center rounded-full bg-card/95 text-xs text-slate md:top-1.5 md:right-1.5 md:size-7 md:text-sm">
                    <LockSimple size="1em" aria-hidden />
                  </span>
                </Page>
                <PageLabel short={t.short[i]} full={label} />
              </LockedPage>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** A page: portrait, dark like the report's covers. Frosted glass over a locked one lets its picture show through, blurred. */
function Page({ frosted = false, children }: { frosted?: boolean; children: ReactNode }) {
  return (
    <span
      className={
        frosted
          ? "relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-night outline-2 outline-offset-2 outline-transparent after:absolute after:inset-0 after:bg-[rgb(228_235_237/0.28)] group-hover/locked:outline-warm-ink group-data-open/locked:outline-warm-ink"
          : "relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-night"
      }
    >
      {children}
    </span>
  );
}

/** Two-character chapter names on phones, where five columns leave no room; the full names from 721px. */
function PageLabel({ short, full, open = false }: { short: string; full: string; open?: boolean }) {
  return (
    <span className={open ? "mt-1.5 block text-center text-xs text-ink" : "mt-1.5 block text-center text-xs text-mist"}>
      <span className="whitespace-nowrap md:hidden">{short}</span>
      <span className="hidden md:inline">{full}</span>
    </span>
  );
}
