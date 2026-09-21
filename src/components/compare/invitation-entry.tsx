"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { CompareSnapshot } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { InvitationActions } from "@/components/pairing/invitation-actions";
import { emitPairingEvent } from "@/lib/pairing-tracking";
import { CompareConsent } from "./compare-consent";

export function InvitationEntry({ resultId, shareId, locale }: { resultId: string; shareId?: string; locale: Locale }) {
  const m = compareMessages[locale];
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<CompareSnapshot | null>(null);
  const [existing, setExisting] = useState<{url:string} | null>(null);
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
    setSnapshot(null); setExisting(null); setError("");
    try {
      const response = await fetch(`/api/comparison-invitations/options?resultId=${encodeURIComponent(resultId)}${shareId ? `&shareId=${encodeURIComponent(shareId)}` : ""}`, { cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: abort.signal });
      const body = await response.json();
      if (current !== sequence.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.message ?? m.failed); return; }
      setSnapshot(body.data.snapshot); setExisting(body.data.activeInvitation);
    } catch { if (current === sequence.current) setError(m.failed); }
    finally { clearTimeout(timeout); }
  }
  function change(open: boolean) { setOpen(open); if (open) { emitPairingEvent("pairing_entry_clicked", resultId, "my_pairing"); void load(); } else { sequence.current++; request.current?.abort(); requestAnimationFrame(() => trigger.current?.focus()); } }
  return <><button ref={trigger} type="button" className="text-link min-h-11 text-sm" onClick={() => change(true)}>{pairingUiMessages[locale].invite}</button><ResponsiveSheet open={open} onOpenChange={change} title={m.create} description={m.createSheetDescription} closeLabel={shareMessages[locale].close}>{open && <div className="mt-5">{existing ? <InvitationActions url={existing.url} locale={locale} /> : snapshot ? <CompareConsent kind="host" resultId={resultId} shareId={shareId} locale={locale} snapshot={snapshot} /> : <><p role="status">{error || m.preparing}</p>{error && <button type="button" className="pill mt-5 min-h-11" onClick={load}>{m.retry}</button>}</>}</div>}</ResponsiveSheet></>;
}
