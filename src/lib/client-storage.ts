"use client";

import { useSyncExternalStore } from "react";
import { QUESTION_COUNT } from "@/lib/personality";
import { storageKeys } from "@/lib/site";

export type QuizProgress = { answers: (number | null)[]; index: number; updatedAt: number };

const EVENT = "mirror:storage";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onStorage);
  };
}

/* `useSyncExternalStore` needs referentially stable snapshots, so parsed values are cached per raw string. */
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string): T | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;
  let value: T | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = null;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota: progress simply won't persist */
  }
  emit();
}

function validProgress(p: QuizProgress | null): QuizProgress | null {
  if (!p || !Array.isArray(p.answers) || p.answers.length !== QUESTION_COUNT) return null;
  return p;
}

export function readQuizProgress(): QuizProgress | null {
  return validProgress(read<QuizProgress>(storageKeys.quiz));
}

export function writeQuizProgress(p: Omit<QuizProgress, "updatedAt"> | null) {
  write(storageKeys.quiz, p ? { ...p, updatedAt: Date.now() } : null);
}

export function readLastResultId(): string | null {
  const v = read<{ id: string }>(storageKeys.lastResult);
  return v?.id ?? null;
}

export function writeLastResultId(id: string | null) {
  write(storageKeys.lastResult, id ? { id } : null);
}

/** Live quiz progress; the store of record for the questionnaire island. Server snapshot is null. */
export function useQuizProgress(): QuizProgress | null {
  return useSyncExternalStore(subscribe, readQuizProgress, () => null);
}

/** True once at least one answer has been saved locally. Server snapshot is false. */
export function useHasQuizProgress(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      const p = readQuizProgress();
      return !!p && p.answers.some((a) => a !== null);
    },
    () => false,
  );
}

/** Last completed result id, or null. Server snapshot is null. */
export function useLastResultId(): string | null {
  return useSyncExternalStore(subscribe, readLastResultId, () => null);
}
