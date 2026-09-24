"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, ImageSquare } from "@phosphor-icons/react";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { track } from "@/lib/analytics/track";
import { useLocale } from "@/lib/i18n/locale-provider";
import { reportMessages } from "@/lib/i18n/messages/report";

/**
 * Saving the report's summary as a picture, as WeChat readers do. The PNG is fetched only when the
 * sheet opens; saving downloads it, and inside WeChat pressing and holding the image saves it.
 */
export function ReportImage({ src, className }: { src: string; className?: string }) {
  const t = reportMessages[useLocale()].image;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`text-link ${className ?? ""}`} onClick={() => { setOpen(true); track("report_image_open"); }}>
        <ImageSquare size={16} aria-hidden />{t.open}
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
        const response = await fetch(src, { cache: "no-store", signal: controller.signal });
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
