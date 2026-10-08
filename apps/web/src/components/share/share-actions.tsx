"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "@phosphor-icons/react";
import type { Locale } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
import { recordShareEvent } from "./share-visit";
import styles from "./share-motion.module.css";

export function ShareActions({ url, imageUrl, token, locale, surface = "result", fallback }: {
  url: string; imageUrl: string; token: string; locale: Locale; surface?: "result" | "share_page" | "my_shares";
  fallback?: ReactNode;
}) {
  const m = shareMessages[locale];
  const [image, setImage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(true);
  const copySequence = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 10000);
    void (async () => {
      try {
        const response = await fetch(imageUrl, { cache: "no-store", signal: controller.signal });
        if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) throw new Error("IMAGE_UNAVAILABLE");
        const blob = await response.blob();
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        const picture = new Image();
        picture.src = objectUrl;
        await picture.decode();
        if (!disposed) { setImage(objectUrl); setImageFailed(false); }
      } catch { if (!disposed) setImageFailed(true); }
      finally { clearTimeout(timeout); }
    })();
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [imageUrl, attempt]);

  async function copy() {
    const sequence = ++copySequence.current;
    if (timer.current) clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(url);
      if (!active.current || sequence !== copySequence.current) return;
      setCopied(true); setManual(false);
      void recordShareEvent(token, "share_link_copied", surface);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { if (active.current && sequence === copySequence.current) { setManual(true); setCopied(false); } }
  }
  function save() {
    if (!image) return;
    void recordShareEvent(token, "share_image_requested", surface);
    const anchor = document.createElement("a");
    anchor.href = image; anchor.download = "mirror-guide.png";
    document.body.append(anchor); anchor.click(); anchor.remove();
  }
  return <div className="min-w-0 space-y-4" data-share-actions>
    {imageFailed && fallback}
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-line bg-paper">
      {/* The exact generated PNG must bypass the Next image optimizer and its persistent cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image ? <img src={image} alt={m.title} width={960} height={1280} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center p-6 text-center text-sm text-mist">{imageFailed ? m.imageFailed : m.loading}</div>}
    </div>
    {imageFailed && <button type="button" className="text-link min-h-11" onClick={() => { setImageFailed(false); setAttempt((value) => value + 1); }}>{m.retryImage}</button>}
    <div className="flex flex-wrap gap-3 print:hidden">
      <button type="button" onClick={save} disabled={!image} className="pill min-h-11 min-w-0 flex-1 disabled:opacity-40">{m.save}</button>
      <button type="button" onClick={copy} className="pill min-h-11 min-w-[140px] flex-1" aria-label={m.copy}>{copied ? <><Check className={styles.copied} aria-hidden="true" size={16} />{m.copied}</> : m.copy}</button>
    </div>
    <p className="text-xs leading-relaxed text-mist print:hidden">{m.longPress}</p>
    <p role="status" aria-live="polite" className="sr-only">{copied ? m.copied : manual ? m.manualCopy : ""}</p>
    {manual && <label className="block text-xs leading-relaxed print:hidden">{m.manualCopy}<input readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-11 w-full min-w-0 rounded border border-line p-2 text-sm" /></label>}
  </div>;
}
