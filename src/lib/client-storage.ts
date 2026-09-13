"use client";

import { useSyncExternalStore } from "react";
import { getQuestionnaire, type QuestionnaireId } from "@/lib/questionnaires";
import { migrateLegacyProgress, normalizeProgress, type QuizProgress } from "@/lib/quiz-progress";
import { storageKeys } from "@/lib/site";
export type { QuizProgress } from "@/lib/quiz-progress";

const listeners = new Set<() => void>();
const memory = new Map<string, unknown>();
const unavailable = new Set<string>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
const emit = () => { for (const listener of listeners) listener(); };
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { listeners.delete(callback); window.removeEventListener("storage", callback); };
}

function read(key: string): unknown {
  // Unsaved local state wins over a stale persistent value after quota/security failures.
  if (memory.has(key)) return memory.get(key);
  let raw: string | null;
  try { raw = window.localStorage.getItem(key); }
  catch { unavailable.add(key); return cache.get(key)?.value ?? null; }
  if (cache.get(key)?.raw === raw) return cache.get(key)!.value;
  let value: unknown = null;
  try { value = raw ? JSON.parse(raw) : null; } catch { /* invalid persistence is ignored */ }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  memory.set(key, value);
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
    cache.set(key, { raw, value });
    memory.delete(key);
    unavailable.delete(key);
  } catch { unavailable.add(key); }
  emit();
}

type DraftState = { activeId: QuestionnaireId | null; drafts: Partial<Record<QuestionnaireId, QuizProgress>> };
const EMPTY_STATE: DraftState = { activeId: null, drafts: {} };
let stateSource: unknown;
let stateCache: DraftState = EMPTY_STATE;
function readDrafts(): DraftState {
  const saved = read(storageKeys.quizVersions);
  const legacy = saved == null ? read(storageKeys.quiz) : null;
  const source = saved ?? legacy;
  if (source === stateSource) return stateCache;
  stateSource = source;
  if (saved && typeof saved === "object" && "drafts" in saved && saved.drafts && typeof saved.drafts === "object") {
    const drafts: DraftState["drafts"] = {};
    for (const [id, value] of Object.entries(saved.drafts)) {
      const p = normalizeProgress(value);
      if (p && p.questionnaireId === id) drafts[p.questionnaireId] = p;
    }
    const activeId = "activeId" in saved && typeof saved.activeId === "string" && getQuestionnaire(saved.activeId) && drafts[saved.activeId as QuestionnaireId] ? saved.activeId as QuestionnaireId : null;
    stateCache = { activeId, drafts };
  } else {
    const p = migrateLegacyProgress(legacy);
    stateCache = p ? { activeId: p.questionnaireId, drafts: { [p.questionnaireId]: p } } : EMPTY_STATE;
  }
  return stateCache;
}

export function readQuizProgress(id?: QuestionnaireId): QuizProgress | null {
  const state = readDrafts();
  const key = id ?? state.activeId;
  return key ? state.drafts[key] ?? null : null;
}

export function writeQuizProgress(progress: Omit<QuizProgress, "updatedAt"> | null) {
  const state = readDrafts();
  const drafts = { ...state.drafts };
  if (progress) {
    const normalized = normalizeProgress({ ...progress, updatedAt: Date.now() });
    if (!normalized) throw new Error("Invalid quiz progress");
    drafts[normalized.questionnaireId] = normalized;
    write(storageKeys.quizVersions, { activeId: normalized.questionnaireId, drafts });
  } else {
    if (state.activeId) delete drafts[state.activeId];
    const activeId = Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt)[0]?.questionnaireId ?? null;
    write(storageKeys.quizVersions, { activeId, drafts });
  }
}

export function readLastResultId(): string | null {
  const value = read(storageKeys.lastResult);
  return value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : null;
}
export function writeLastResultId(id: string | null) { write(storageKeys.lastResult, id ? { id } : null); }
export function useQuizProgress() { return useSyncExternalStore(subscribe, readQuizProgress, () => null); }
export function useQuizDrafts() { return useSyncExternalStore(subscribe, readDrafts, () => EMPTY_STATE); }
export function useStorageAvailable() { return useSyncExternalStore(subscribe, () => unavailable.size === 0, () => true); }
export function useHasQuizProgress() { return useSyncExternalStore(subscribe, () => Object.values(readDrafts().drafts).some((p) => Object.values(p.answers).some((a) => a !== null)), () => false); }
export function useLastResultId() { return useSyncExternalStore(subscribe, readLastResultId, () => null); }
