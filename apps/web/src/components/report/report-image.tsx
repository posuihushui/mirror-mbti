"use client";

import { useEffect, useState } from "react";
import { ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { track } from "@/lib/analytics/track";
import { useLocale } from "@/lib/i18n/locale-provider";
import { reportMessages } from "@/lib/i18n/messages/report";

/**
 * Saving the report's summary as a picture, as WeChat readers do. The trigger is a card showing the
 * picture itself (lazy, so it renders once the card is near the screen); the sheet reuses that
 * response from the browser cache. Saving downloads it, and inside WeChat pressing and holding the image saves it.
 */
export function ReportImage({ src, className }: { src: string; className?: string }) {
  const t = reportMessages[useLocale()].image;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`group flex w-full items-center gap-4 border border-line bg-card p-3 text-left transition-colors hover:border-[#9eacb0] ${className ?? ""}`} onClick={() => { setOpen(true); track("report_image_open"); }}>
        <span className="aspect-[3/4] w-14 shrink-0 overflow-hidden border border-line bg-night">
          {/* eslint-disable-next-line @next/next/no-img-element -- the private PNG bypasses the image optimizer. */}
          <img src={src} alt="" loading="lazy" decoding="async" width={960} height={1280} className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{t.open}</span>
          <span className="mt-1 block text-xs text-mist">{t.teaser}</span>
        </span>
        <ArrowRight size={15} aria-hidden className="shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
      </button>
      <ResponsiveSheet open={open} onOpenChange={setOpen} title={t.title} description={t.description}>
        {open && <ReportImagePreview src={src} />}
      </ResponsiveSheet>
    </>
  );
}

function ReportImagePreview({ src }: { src: string }) {
  const t = reportMessages[useLocale()].image;
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    let disposed = false;
    void (async () => {
      try {
        // A retry asks the server again; the first open reuses the thumbnail's response.
        const response = await fetch(src, { cache: attempt ? "reload" : "default", signal: controller.signal });
        if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) throw new Error("IMAGE_UNAVAILABLE");
        objectUrl = URL.createObjectURL(await response.blob());
        if (!disposed) { setImage(objectUrl); setFailed(false); }
      } catch { if (!disposed) setFailed(true); }
    })();
    return () => { disposed = true; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, attempt]);
  const save = () => {
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = "mirror-report.png";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[4px] border border-line bg-paper">
        {/* The generated PNG bypasses the image optimizer: it is private and never cached. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image} alt={t.title} width={960} height={1280} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center p-6 text-center text-sm text-mist">{failed ? t.failed : t.loading}</div>}
      </div>
      {failed && <button type="button" className="text-link" onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}>{t.retry}</button>}
      <button type="button" onClick={save} disabled={!image} className="pill min-h-[52px] disabled:opacity-40">{t.save}<DownloadSimple size={18} weight="light" aria-hidden /></button>
      <p className="text-xs text-mist">{t.longPress}</p>
    </div>
  );
}
