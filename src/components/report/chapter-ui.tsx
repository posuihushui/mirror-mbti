"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { cn } from "cn";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { reportMessages } from "@/lib/i18n/messages/report";
import { chapterLabelsFor } from "@/lib/site";
import { chapterPanelId, chapterTabId, setChapter, useChapter } from "./chapter-store";

/**
 * Interactive shell around server-rendered chapters. Every chapter is in the DOM;
 * these components only switch which one is visible.
 */

export function ChapterPanel({ index, children, after }: { index: number; children: ReactNode; after?: ReactNode }) {
  const chapter = useChapter();
  return (
    <div
      id={chapterPanelId(index)}
      role="tabpanel"
      aria-labelledby={chapterTabId(index)}
      hidden={chapter !== index}
      className={after ? undefined : "report-chapter-motion"}
    >
      {after ? <div className="report-chapter-motion">{children}</div> : children}
      {after}
    </div>
  );
}

/** Switches chapter; a view is recorded only when the reader lands on a different one. */
function openChapter(index: number, current: number, method: "tab" | "sidebar" | "next") {
  setChapter(index);
  if (index !== current) track("report_chapter_view", { chapter_number: index + 1, nav_method: method });
}

/** Desktop sidebar chapter list. */
export function ChapterSidebarNav() {
  const chapter = useChapter();
  const locale = useLocale();
  return (
    <nav className="mt-10 flex flex-col" aria-label={reportMessages[locale].nav.label}>
      {chapterLabelsFor(locale).map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => openChapter(i, chapter, "sidebar")}
          aria-current={chapter === i ? "true" : undefined}
          className={cn("chapter-tab-motion relative flex min-h-[52px] items-center gap-4 border-b border-line pl-4 text-left text-sm text-mist hover:text-ink", chapter === i && "font-medium text-ink")}
        >
          {/* The current chapter is marked by a warm bar, not by an arrow that would read as a link out. */}
          <span aria-hidden className="chapter-bar-motion absolute top-3 bottom-3 left-0 w-0.5 bg-warm" />
          <span className="text-xs text-mist">0{i + 1}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

/** Phone chapter tabs above the article. */
export function ChapterTabs() {
  const chapter = useChapter();
  const locale = useLocale();
  return (
    <div
      role="tablist"
      aria-label={reportMessages[locale].nav.label}
      className="-mx-2 grid grid-cols-4 border-b border-night-line md:hidden"
    >
      {chapterLabelsFor(locale).map((label, i) => (
        <button
          key={label}
          id={chapterTabId(i)}
          type="button"
          role="tab"
          aria-selected={chapter === i}
          aria-controls={chapterPanelId(i)}
          onClick={() => openChapter(i, chapter, "tab")}
          className={cn("chapter-tab-motion relative min-h-11 py-2.5 text-xs leading-snug text-night-mist", locale === "en" ? "min-w-0 px-1 hyphens-auto break-words whitespace-normal" : "whitespace-nowrap", chapter === i && "text-paper")}
        >
          {label}
          <span aria-hidden className={cn("absolute inset-x-3 -bottom-px h-0.5 bg-warm transition-opacity", chapter === i ? "opacity-100" : "opacity-0")} />
        </button>
      ))}
    </div>
  );
}

/** "下一章" link, or the closing link on the last chapter. The sample closes with the test instead. */
export function ChapterFooterNav({ sample = false }: { sample?: boolean }) {
  const chapter = useChapter();
  const locale = useLocale();
  const t = reportMessages[locale].nav;
  const labels = chapterLabelsFor(locale);
  const last = chapter === labels.length - 1;
  return (
    <div className="mt-6 border-t border-line pt-4 pb-2 text-right">
      {last ? (
        <Link href={href(locale, sample ? "/quiz" : "/")} className="text-link font-medium" {...trackAttrs(sample ? "start_quiz" : "home", "report_closing")}>
          {sample ? t.closingSample : t.closing}
          <ArrowRight size={17} />
        </Link>
      ) : (
        <button type="button" onClick={() => openChapter(chapter + 1, chapter, "next")} className="text-link font-medium">
          {t.next(labels[chapter + 1])}
          <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}

/** Chapter 02 segmented control. Both lists are server-rendered; this toggles visibility. */
export function StrengthSwitch({ strengths, blindspots }: { strengths: ReactNode; blindspots: ReactNode }) {
  const [strength, setStrength] = useState(true);
  const t = reportMessages[useLocale()].nav;
  return (
    <>
      <div className="relative mb-6 flex rounded-[50px] bg-[#e3e9ea] p-1" role="tablist" aria-label={t.switchLabel}>
        <span aria-hidden="true" className="strength-indicator-motion pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-8px)/2)] rounded-[50px] bg-ink" style={{ transform: strength ? "translateX(0)" : "translateX(100%)" }} />
        {(
          [
            [t.strengths, true],
            [t.blindspots, false],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={strength === value}
            onClick={() => {
              if (strength !== value) track("report_tab_switch", { tab: value ? "strengths" : "blindspots" });
              setStrength(value);
            }}
            className={cn(
              "strength-tab-motion relative min-h-11 min-w-0 flex-1 rounded-[50px] text-sm text-mist",
              strength === value && "text-paper",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="strength-content-motion" hidden={!strength}>{strengths}</div>
      <div className="strength-content-motion" hidden={strength}>{blindspots}</div>
    </>
  );
}
