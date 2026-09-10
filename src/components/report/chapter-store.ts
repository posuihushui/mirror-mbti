"use client";

import { useSyncExternalStore } from "react";

/**
 * The active report chapter, derived from `?chapter=`. Keeping the URL as the single
 * source of truth lets every chapter be server-rendered (no `useState` seeding, no
 * hydration mismatch) while back/forward and shared links still work.
 */
const CHAPTER_PARAM = "chapter";
const CHAPTER_COUNT = 4;

const listeners = new Set<() => void>();

export function parseChapter(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= CHAPTER_COUNT ? n - 1 : 0;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function getSnapshot(): number {
  return parseChapter(new URLSearchParams(window.location.search).get(CHAPTER_PARAM));
}

export function useChapter(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

export function setChapter(index: number) {
  const url = new URL(window.location.href);
  if (index === 0) url.searchParams.delete(CHAPTER_PARAM);
  else url.searchParams.set(CHAPTER_PARAM, String(index + 1));
  window.history.replaceState(window.history.state, "", url);
  for (const listener of listeners) listener();
  window.scrollTo({ top: 0 });
}

export const chapterPanelId = (index: number) => `chapter-panel-${index + 1}`;
export const chapterTabId = (index: number) => `chapter-tab-${index + 1}`;
