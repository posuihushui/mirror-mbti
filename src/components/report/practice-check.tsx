"use client";

import { useSyncExternalStore } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "cn";
import { track } from "@/lib/analytics/track";
import { useLocale } from "@/lib/i18n/locale-provider";
import { reportMessages } from "@/lib/i18n/messages/report";
import { storageKeys } from "@/lib/site";

/**
 * Tick-boxes for the report's seven-day practice. The days themselves are server-rendered by
 * `ReportBody`; this island only remembers which ones this browser has ticked. It is a reading
 * convenience: nothing is sent to the server, and an unavailable storage just keeps the ticks in memory.
 */
type Days = Record<string, number[]>;

const listeners = new Set<() => void>();
let memory: Days | null = null;
let cache: { raw: string | null; value: Days } = { raw: null, value: {} };

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { listeners.delete(callback); window.removeEventListener("storage", callback); };
}

function readAll(): Days {
  if (memory) return memory;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(storageKeys.practice); } catch { return cache.value; }
  if (raw === cache.raw) return cache.value;
  let value: Days = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") value = parsed as Days;
  } catch { /* invalid persistence is ignored */ }
  cache = { raw, value };
  return value;
}

function writeAll(value: Days) {
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(storageKeys.practice, raw);
    cache = { raw, value };
    memory = null;
  } catch { memory = value; }
  for (const listener of listeners) listener();
}

const EMPTY: number[] = [];

function useDays(reportKey: string): number[] {
  return useSyncExternalStore(subscribe, () => readAll()[reportKey] ?? EMPTY, () => EMPTY);
}

export function PracticeCheck({ reportKey, day, label }: { reportKey: string; day: number; label: string }) {
  const days = useDays(reportKey);
  const done = days.includes(day);
  const toggle = () => {
    const all = readAll();
    const current = all[reportKey] ?? [];
    const next = done ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b);
    writeAll({ ...all, [reportKey]: next });
    track("report_practice_check", { day_number: day, checked: !done });
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={toggle}
      className={cn(
        "quiz-choice-motion flex size-7 shrink-0 items-center justify-center rounded-full border border-[#b9c5c9] text-paper",
        done && "border-ink bg-ink",
      )}
    >
      {done && <Check size={15} weight="bold" className="quiz-check-motion" />}
    </button>
  );
}

export function PracticeProgress({ reportKey, total }: { reportKey: string; total: number }) {
  const locale = useLocale();
  const done = useDays(reportKey).length;
  return <p className="text-xs text-mist" aria-live="polite">{reportMessages[locale].four.dayProgress(done, total)}</p>;
}
