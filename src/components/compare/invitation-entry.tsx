"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { CompareSnapshot } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { CompareConsent } from "./compare-consent";

export function InvitationEntry({ shareId, locale }: { shareId: string; locale: Locale }) {
  const m = compareMessages[locale];
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<CompareSnapshot | null>(null);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);
  async function load() {
    request.current?.abort();
    const current = ++sequence.current;
    const abort = new AbortController(); request.current = abort;
    const timeout = setTimeout(() => abort.abort(), 10000);
    setSnapshot(null); setError("");
    try {
      const response = await fetch(`/api/comparison-invitations/options?shareId=${encodeURIComponent(shareId)}`, { cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: abort.signal });
      const body = await response.json();
      if (current !== sequence.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.message ?? m.failed); return; }
      setSnapshot(body.data.snapshot);
    } catch { if (current === sequence.current) setError(m.failed); }
    finally { clearTimeout(timeout); }
  }
  function change(open: boolean) { setOpen(open); if (open) void load(); else { sequence.current++; request.current?.abort(); requestAnimationFrame(() => trigger.current?.focus()); } }
  return <><button ref={trigger} type="button" className="text-link min-h-11 text-sm" onClick={() => change(true)}>{m.create}</button><ResponsiveSheet open={open} onOpenChange={change} title={m.create} description={m.hostConsentDetail} closeLabel={shareMessages[locale].close}>{open && <div className="mt-5">{snapshot ? <CompareConsent kind="host" shareId={shareId} locale={locale} snapshot={snapshot} /> : <><p role="status">{error || m.preparing}</p>{error && <button type="button" className="pill mt-5 min-h-11" onClick={load}>{m.retry}</button>}</>}</div>}</ResponsiveSheet></>;
}
