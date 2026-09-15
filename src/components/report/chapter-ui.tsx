"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
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

export function ChapterPanel({ index, children }: { index: number; children: ReactNode }) {
  const chapter = useChapter();
  return (
    <div
      id={chapterPanelId(index)}
      role="tabpanel"
      aria-labelledby={chapterTabId(index)}
      hidden={chapter !== index}
      className="report-chapter-motion"
    >
      {children}
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
    <nav className="mt-[46px] flex flex-col gap-1" aria-label={reportMessages[locale].nav.label}>
      {chapterLabelsFor(locale).map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => openChapter(i, chapter, "sidebar")}
          aria-current={chapter === i ? "true" : undefined}
          className={cn("chapter-tab-motion flex min-h-[54px] items-center gap-4 border-b border-line text-left text-[12px]", chapter === i && "font-semibold")}
        >
          <span className="text-[10px] text-[#929ea4]">0{i + 1}</span>
          {label}
          <ArrowUpRight size={15} className={cn("chapter-arrow-motion ml-auto opacity-0", chapter === i && "opacity-100")} />
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
      className="-mx-[10px] mb-[31px] grid grid-cols-4 border-b border-[#344046] pb-[10px] md:hidden"
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
          className={cn("chapter-tab-motion py-[9px] text-[10px] leading-[1.8] whitespace-nowrap text-[#7f949c]", chapter === i && "text-[#e1c4aa]")}
        >
          {label}
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
    <div className="mt-[38px] border-t border-night-line pt-[21px] text-right">
      {last ? (
        <Link href={href(locale, sample ? "/quiz" : "/")} className="text-link text-[11px] text-[#e0e7ea]" {...trackAttrs(sample ? "start_quiz" : "home", "report_closing")}>
          {sample ? t.closingSample : t.closing}
          <ArrowUpRight size={17} />
        </Link>
      ) : (
        <button type="button" onClick={() => openChapter(chapter + 1, chapter, "next")} className="text-link text-[11px] text-[#e0e7ea]">
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
      <div className="relative my-7 flex rounded-[50px] bg-[#263034] p-1" role="tablist" aria-label={t.switchLabel}>
        <span aria-hidden="true" className="strength-indicator-motion pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-8px)/2)] rounded-[50px] bg-[#eef2f3]" style={{ transform: strength ? "translateX(0)" : "translateX(100%)" }} />
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
              "strength-tab-motion relative min-h-[37px] min-w-0 flex-1 rounded-[50px] text-[11px] text-[#9aaab0] md:text-[12px]",
              strength === value && "text-[#222a2d]",
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
