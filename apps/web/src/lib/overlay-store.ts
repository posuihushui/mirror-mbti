"use client";

import { useSyncExternalStore } from "react";

export type SiteOverlay = "about" | "empty" | null;

let current: SiteOverlay = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function openOverlay(overlay: Exclude<SiteOverlay, null>) {
  current = overlay;
  emit();
}

export function closeOverlay() {
  current = null;
  emit();
}

export function useOverlay(): SiteOverlay {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}
