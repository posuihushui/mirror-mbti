"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";

export function CompareRevoke({ id, locale, kind = "pair", onRevoked }: { id: string; locale: Locale; kind?: "pair" | "invitation"; onRevoked?: () => void }) {
  const m = compareMessages[locale]; const s = shareMessages[locale]; const router = useRouter();
  const [open, setOpen] = useState(false); const [pending, setPending] = useState(false); const [revoked, setRevoked] = useState(false); const [error, setError] = useState("");
  const busy = useRef(false);
  const active = useRef(true); const request = useRef<AbortController | null>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; request.current?.abort(); }; }, []);
  async function revoke() {
    if (busy.current) return;
    busy.current = true;
    const abort = new AbortController(); request.current = abort;
    const timeout = setTimeout(() => abort.abort(), 10000); setPending(true); setError("");
    try {
      const response = await fetch(`/api/${kind === "pair" ? "comparisons" : "comparison-invitations"}/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: abort.signal });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error?.message ?? m.failed); }
      if (active.current) { setRevoked(true); setOpen(false); onRevoked?.(); router.refresh(); }
    } catch (error) { if (active.current) setError(error instanceof Error && !abort.signal.aborted ? error.message : m.failed); }
    finally { clearTimeout(timeout); busy.current = false; if (active.current) setPending(false); }
  }
  function close(open: boolean) { setOpen(open); if (!open) requestAnimationFrame(() => trigger.current?.focus()); }
  if (revoked) return <p role="status" className="text-sm">{m.revoked}</p>;
  return <><button ref={trigger} type="button" className="text-link min-h-11 text-sm print:hidden" onClick={() => close(true)}>{kind === "pair" ? m.revoke : m.closeInvitation}</button><ResponsiveSheet open={open} onOpenChange={close} title={kind === "pair" ? m.revoke : m.closeInvitation} description={kind === "pair" ? m.revokeConfirm : m.closeInvitationConfirm} closeLabel={s.close}><p role="status" className="mt-4 text-sm">{error}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" className="pill min-h-11 flex-1" onClick={revoke} disabled={pending}>{pending ? s.closing : kind === "pair" ? m.revoke : m.closeInvitation}</button><button type="button" className="text-link min-h-11 flex-1" onClick={() => close(false)}>{s.cancel}</button></div></ResponsiveSheet></>;
}
