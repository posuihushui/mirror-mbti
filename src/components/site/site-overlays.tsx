"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { AboutContent } from "@/components/site/about-content";
import { EmptyReportContent } from "@/components/site/empty-report-content";
import { closeOverlay, useOverlay } from "@/lib/overlay-store";

/** Site-wide "了解测试" and "我的报告（空）" sheets. Mounted once in the root layout. */
export function SiteOverlays({ priceLabel }: { priceLabel: string }) {
  const overlay = useOverlay();
  const pathname = usePathname();

  useEffect(() => {
    closeOverlay();
  }, [pathname]);

  return (
    <>
      <ResponsiveSheet
        open={overlay === "about"}
        onOpenChange={(o) => !o && closeOverlay()}
        title="关于这次探索"
        description="按照自己的节奏，回答每一道题。"
      >
        <AboutContent priceLabel={priceLabel} onStart={closeOverlay} />
      </ResponsiveSheet>
      <ResponsiveSheet
        open={overlay === "empty"}
        onOpenChange={(o) => !o && closeOverlay()}
        title="属于你的故事，还未开始。"
        description="完成测试后，在这里找回本次的性格报告。"
      >
        <EmptyReportContent onNavigate={closeOverlay} />
      </ResponsiveSheet>
    </>
  );
}
