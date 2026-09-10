"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { cn } from "cn";
import { chapterLabels } from "@/lib/site";
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
      className="animate-appear"
    >
      {children}
    </div>
  );
}

/** Desktop sidebar chapter list. */
export function ChapterSidebarNav() {
  const chapter = useChapter();
  return (
    <nav className="mt-[46px] flex flex-col gap-1" aria-label="报告章节">
      {chapterLabels.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => setChapter(i)}
          aria-current={chapter === i ? "true" : undefined}
          className={cn("flex min-h-[54px] items-center gap-4 border-b border-line text-left text-[12px]", chapter === i && "font-semibold")}
        >
          <span className="text-[10px] text-[#929ea4]">0{i + 1}</span>
          {label}
          <ArrowUpRight size={15} className={cn("ml-auto opacity-0", chapter === i && "opacity-100")} />
        </button>
      ))}
    </nav>
  );
}

/** Phone chapter tabs above the article. */
export function ChapterTabs() {
  const chapter = useChapter();
  return (
    <div
      role="tablist"
      aria-label="报告章节"
      className="-mx-[10px] mb-[31px] grid grid-cols-4 border-b border-[#344046] pb-[10px] md:hidden"
    >
      {chapterLabels.map((label, i) => (
        <button
          key={label}
          id={chapterTabId(i)}
          type="button"
          role="tab"
          aria-selected={chapter === i}
          aria-controls={chapterPanelId(i)}
          onClick={() => setChapter(i)}
          className={cn("py-[9px] text-[10px] leading-[1.8] whitespace-nowrap text-[#7f949c]", chapter === i && "text-[#e1c4aa]")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** "下一章" link, or the closing link on the last chapter. */
export function ChapterFooterNav() {
  const chapter = useChapter();
  const last = chapter === chapterLabels.length - 1;
  return (
    <div className="mt-[38px] border-t border-night-line pt-[21px] text-right">
      {last ? (
        <Link href="/" className="text-link text-[11px] text-[#e0e7ea]">
          带着新的理解，回到生活
          <ArrowUpRight size={17} />
        </Link>
      ) : (
        <button type="button" onClick={() => setChapter(chapter + 1)} className="text-link text-[11px] text-[#e0e7ea]">
          下一章 · {chapterLabels[chapter + 1]}
          <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}

/** Chapter 02 segmented control. Both lists are server-rendered; this toggles visibility. */
export function StrengthSwitch({ strengths, blindspots }: { strengths: ReactNode; blindspots: ReactNode }) {
  const [strength, setStrength] = useState(true);
  return (
    <>
      <div className="my-7 flex rounded-[50px] bg-[#263034] p-1" role="tablist" aria-label="优势与盲点">
        {(
          [
            ["你的优势", true],
            ["容易忽略的", false],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={strength === value}
            onClick={() => setStrength(value)}
            className={cn(
              "min-h-[37px] flex-1 rounded-[50px] text-[11px] text-[#9aaab0] md:text-[12px]",
              strength === value && "bg-[#eef2f3] text-[#222a2d]",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div hidden={!strength}>{strengths}</div>
      <div hidden={strength}>{blindspots}</div>
    </>
  );
}
