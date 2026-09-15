"use client";

import type { ReactNode } from "react";
import type { TrackAttrs } from "@/lib/analytics/events";
import { openOverlay, type SiteOverlay } from "@/lib/overlay-store";

export function OverlayButton({
  overlay,
  className,
  children,
  ...track
}: {
  overlay: Exclude<SiteOverlay, null>;
  className?: string;
  children: ReactNode;
} & Partial<TrackAttrs>) {
  return (
    <button type="button" className={className} onClick={() => openOverlay(overlay)} {...track}>
      {children}
    </button>
  );
}
