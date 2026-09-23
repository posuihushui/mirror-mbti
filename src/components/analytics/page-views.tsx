"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics/track";

/**
 * Sends `page_view` after client navigations; `instrumentation-client.ts` sends the first one.
 * The pathname is only a change signal: the proxy rewrite can make it read `/en/...`, so the
 * tracker reads `window.location` instead.
 */
export function PageViews() {
  const pathname = usePathname();
  useEffect(() => {
    trackPageView();
  }, [pathname]);
  return null;
}
