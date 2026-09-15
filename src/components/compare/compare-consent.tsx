"use client";
import { useEffect, useRef, useState } from "react";
import { href, type Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { CompareSnapshot } from "@/lib/compare-types";
import { PreferenceSummary } from "./preference-summary";

type Props = { locale: Locale; snapshot: CompareSnapshot } & ({ kind: "host"; shareId: string } | { kind: "guest"; invitationToken: string; resultId: string });
export function CompareConsent(props: Props) {
  const m = compareMessages[props.locale];
  const share = shareMessages[props.locale];
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<{ url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const requestId = useRef<string | null>(null);
  const active = useRef(true);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copySequence = useRef(0);
  const busy = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; request.current?.abort(); if (timer.current) clearTimeout(timer.current); }; }, []);
  async function submit() {
    if (!consent || busy.current) return;
    busy.current = true;
    requestId.current ??= crypto.randomUUID();
    const abort = new AbortController(); request.current = abort;
    const timeout = setTimeout(() => abort.abort(), 10000);
    setPending(true); setError("");
    try {
      const response = await fetch(props.kind === "host" ? "/api/comparison-invitations" : "/api/comparisons", { method: "POST", cache: "no-store", signal: abort.signal, headers: { "Content-Type": "application/json", "X-Mirror-Locale": props.locale }, body: JSON.stringify(props.kind === "host" ? { shareId: props.shareId, consentVersion: "compare-host-v1", requestId: requestId.current } : { invitationToken: props.invitationToken, resultId: props.resultId, consentVersion: "compare-guest-v1" }) });
      const body = await response.json();
      if (!active.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.message ?? m.failed); return; }
      if (props.kind === "host") setInvitation(body.data);
      else window.location.assign(body.data.url);
    } catch { if (active.current) setError(m.failed); }
    finally { clearTimeout(timeout); busy.current = false; if (active.current) setPending(false); }
  }
  async function copy() {
    if (!invitation) return;
    const current = ++copySequence.current;
    try { await navigator.clipboard.writeText(invitation.url); if (active.current && current === copySequence.current) { setCopied(true); setManual(false); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000); } }
    catch { if (active.current && current === copySequence.current) { setManual(true); setCopied(false); } }
  }
  if (invitation) return <div className="mt-5 space-y-4"><p role="status">{m.created}</p><a href={invitation.url} className="text-link inline-flex min-h-11">{share.preview}</a><button type="button" aria-label={share.copy} className="pill min-h-11 w-full" onClick={copy}>{copied ? share.copied : share.copy}</button><p role="status" className="sr-only">{copied ? share.copied : manual ? share.manualCopy : ""}</p>{manual && <label className="block text-xs">{share.manualCopy}<input readOnly value={invitation.url} onFocus={(event) => event.currentTarget.select()} className="mt-3 min-h-11 w-full min-w-0 border border-line p-2" /></label>}<a href={href(props.locale, "/my/shares")} className="text-link inline-flex min-h-11 text-sm">{share.myShares}</a></div>;
  return <div className="space-y-5" data-compare-consent={props.kind}>
    <PreferenceSummary snapshot={props.snapshot} locale={props.locale} title={m.you} />
    <p className="text-sm leading-[1.8]">{props.kind === "host" ? m.hostConsent : m.guestConsent}</p><p className="text-xs leading-[1.8] text-mist">{props.kind === "host" ? m.hostConsentDetail : m.guestConsentDetail}</p>
    <label className="flex min-h-11 items-start gap-3 text-sm leading-[1.8]"><input type="checkbox" checked={consent} disabled={pending} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-ink" />{m.agree}</label>
    <p role="status" className="text-sm">{error || (pending ? m.generating : "")}</p><button type="button" className="pill min-h-11 w-full disabled:opacity-40" disabled={!consent || pending} onClick={submit}>{pending ? m.generating : props.kind === "host" ? m.create : m.join}</button>
    <a className="text-link inline-flex min-h-11 text-sm" href={href(props.locale, "/my/shares")}>{share.myShares}</a>
    <noscript><p>{share.noJs}</p></noscript>
  </div>;
}
