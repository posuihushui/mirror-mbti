"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { AboutContent } from "@/components/site/about-content";
import { EmptyReportContent } from "@/components/site/empty-report-content";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";
import { closeOverlay, useOverlay } from "@/lib/overlay-store";

/** Site-wide "了解测试" and "我的报告（空）" sheets. Mounted once in the root layout. */
export function SiteOverlays({ priceLabel }: { priceLabel: string }) {
  const overlay = useOverlay();
  const pathname = usePathname();
  const t = siteMessages[useLocale()].overlays;

  useEffect(() => {
    closeOverlay();
  }, [pathname]);

  return (
    <>
      <ResponsiveSheet
        open={overlay === "about"}
        onOpenChange={(o) => !o && closeOverlay()}
        title={t.aboutTitle}
        description={t.aboutDescription}
      >
        <AboutContent priceLabel={priceLabel} onStart={closeOverlay} />
      </ResponsiveSheet>
      <ResponsiveSheet
        open={overlay === "empty"}
        onOpenChange={(o) => !o && closeOverlay()}
        title={t.emptyTitle}
        description={t.emptyDescription}
      >
        <EmptyReportContent onNavigate={closeOverlay} />
      </ResponsiveSheet>
    </>
  );
}
