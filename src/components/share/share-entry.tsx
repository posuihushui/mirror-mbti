"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { ShareComposer, type ShareOptions } from "./share-composer";
import { ShareReveal } from "./share-reveal";

export function ShareEntry({ resultId, locale }: { resultId: string; locale: Locale }) {
  const m = shareMessages[locale];
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ShareOptions | null>(null);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  // Keep uncertain publication identities in memory until the owner re-fetches management data.
  const submittedRequests = useRef<string[]>([]);
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);
  async function load() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const current = ++sequence.current;
    setError(""); setOptions(null);
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`/api/results/${encodeURIComponent(resultId)}/share-options`, { cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: controller.signal });
      const body = await response.json();
      if (current !== sequence.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.code === "NO_SESSION" ? m.sessionUnavailable : body.error?.message ?? m.error); return; }
      setOptions(body.data);
    } catch { if (current === sequence.current) setError(m.error); }
    finally { clearTimeout(timer); }
  }
  function changeOpen(value: boolean) {
    setOpen(value);
    if (value) void load();
    else { sequence.current++; request.current?.abort(); requestAnimationFrame(() => trigger.current?.focus()); }
  }
  return <section className="border-t border-line px-[27px] py-6 md:px-0 md:py-8" data-share-entry>
    <ShareReveal mode="entry"><h2 data-share-reveal className="text-xl font-medium leading-snug">{m.entryTitle}</h2><p data-share-reveal className="mt-3 text-sm leading-[1.8] text-mist">{m.entryDescription}</p></ShareReveal>
    <button ref={trigger} type="button" onClick={() => changeOpen(true)} className="pill mt-5 min-h-11 max-w-full">{m.create}</button>
    <noscript><p className="mt-3 text-xs">{m.noJs}</p></noscript>
    <ResponsiveSheet open={open} onOpenChange={changeOpen} title={m.title} description={m.entryDescription} closeLabel={m.close}>
      {open && (options ? <ShareComposer resultId={resultId} locale={locale} options={options} onRequest={(id) => { if (!submittedRequests.current.includes(id)) submittedRequests.current = [...submittedRequests.current.slice(-9), id]; }} /> : <div className="py-6"><p role="status" className="text-sm">{error || m.loading}</p>{error && <button type="button" className="pill mt-4 min-h-11" onClick={() => void load()}>{m.retry}</button>}</div>)}
    </ResponsiveSheet>
  </section>;
}
