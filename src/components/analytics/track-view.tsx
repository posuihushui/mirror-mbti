"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEvents } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

type ViewEvent = "result_view" | "report_view" | "my_report_view" | "view_item" | "page_not_found";

/**
 * Sends one view event per mounted page, so Server Components can record what the reader saw
 * without becoming client code. A `router.refresh()` re-render does not send it again.
 */
export function TrackView<E extends ViewEvent>({ event, params }: { event: E; params?: AnalyticsEvents[E] }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    (track as (name: ViewEvent, params?: object) => void)(event, params);
  }, [event, params]);
  return null;
}
