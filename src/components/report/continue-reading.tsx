"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { reportMessages } from "@/lib/i18n/messages/report";
import { chapterLabelsFor } from "@/lib/site";
import { setChapter, useChapter } from "./chapter-store";

const KEY = "mirror.reading.v1";
const noopSubscribe = () => () => {};

function readAll(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { return {}; }
}

/**
 * The chapter a report was left on, read the first time this page asks for it, before this visit's
 * own reading is saved over it. Hydration asks first, so the value is always the previous visit's.
 */
const previous = new Map<string, number>();
function previousChapter(reportKey: string) {
  if (!previous.has(reportKey)) previous.set(reportKey, readAll()[reportKey] ?? 0);
  return previous.get(reportKey)!;
}

export function ContinueReading({ reportKey }: { reportKey: string }) {
  const locale = useLocale();
  const chapter = useChapter();
  const initial = useSyncExternalStore(noopSubscribe, () => previousChapter(reportKey), () => 0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [reportKey]: chapter })); } catch { /* storage is optional */ }
  }, [reportKey, chapter]);

  if (dismissed || initial <= 0 || chapter !== 0) return null;
  const label = `${reportMessages[locale].nav.chapter(initial)} · ${chapterLabelsFor(locale)[initial]}`;
  return (
    <button
      type="button"
      onClick={() => { setDismissed(true); setChapter(initial); }}
      className="text-link my-4 w-full justify-between border border-line bg-card px-4 font-medium md:mt-0 md:mb-6"
    >
      {reportMessages[locale].resume(label)}
      <ArrowRight size={16} aria-hidden />
    </button>
  );
}
