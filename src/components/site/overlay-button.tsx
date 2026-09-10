"use client";

import type { ReactNode } from "react";
import { openOverlay, type SiteOverlay } from "@/lib/overlay-store";

export function OverlayButton({
  overlay,
  className,
  children,
}: {
  overlay: Exclude<SiteOverlay, null>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openOverlay(overlay)}>
      {children}
    </button>
  );
}
