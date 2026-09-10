"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-safe media query hook. The server snapshot returns `serverValue`
 * (mobile-first: false for desktop queries) so markup matches on first paint.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const DESKTOP_QUERY = "(min-width: 721px)";
