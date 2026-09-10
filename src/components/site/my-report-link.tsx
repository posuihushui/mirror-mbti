"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLastResultId } from "@/lib/client-storage";
import { openOverlay } from "@/lib/overlay-store";

/** "我的报告": jumps to the visitor's latest result when one exists locally, otherwise opens the empty-state sheet. */
export function MyReportLink({ className, children }: { className?: string; children: ReactNode }) {
  const lastId = useLastResultId();
  if (lastId) {
    return (
      <Link href="/my/report" className={className} prefetch={false}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => openOverlay("empty")}>
      {children}
    </button>
  );
}
