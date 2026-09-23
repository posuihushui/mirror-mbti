"use client";
import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState } from "react";
import { href, type Locale } from "@/lib/i18n/locale";

import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { InvitationActions } from "@/components/pairing/invitation-actions";
import styles from "@/components/pairing/pairing.module.css";
import { shareMessages } from "@/lib/i18n/messages/share";
import { HOST_NOTE_MAX, type CompareSnapshot } from "@/lib/compare-types";
import { PreferenceSummary } from "./preference-summary";

type Props = { locale: Locale; snapshot: CompareSnapshot } & ({ kind: "host"; resultId: string; shareId?: string } | { kind: "guest"; invitationToken: string; resultId: string });
export function CompareConsent(props: Props) {
  const m = compareMessages[props.locale];
  const share = shareMessages[props.locale];
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<{ url: string } | null>(null);
  const requestId = useRef<string | null>(null);
  const active = useRef(true);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; request.current?.abort(); }; }, []);
  async function submit() {
    if (!consent || busy.current) return;
    busy.current = true;
    requestId.current ??= crypto.randomUUID();
    const abort = new AbortController(); request.current = abort;
    const timeout = setTimeout(() => abort.abort(), 10000);
    setPending(true); setError("");
    try {
      const response = await fetch(props.kind === "host" ? "/api/comparison-invitations" : "/api/comparisons", { method: "POST", cache: "no-store", signal: abort.signal, headers: { "Content-Type": "application/json", "X-Mirror-Locale": props.locale }, body: JSON.stringify(props.kind === "host" ? { resultId: props.resultId, ...(props.shareId ? { shareId: props.shareId } : {}), ...(note.trim() ? { hostNote: note } : {}), consentVersion: "compare-host-v3", requestId: requestId.current } : { invitationToken: props.invitationToken, resultId: props.resultId, consentVersion: "compare-guest-v2" }) });
      const body = await response.json();
      if (!active.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.message ?? m.failed); return; }
      if (props.kind === "host") setInvitation(body.data);
      else window.location.assign(body.data.url);
    } catch { if (active.current) setError(m.failed); }
    finally { clearTimeout(timeout); busy.current = false; if (active.current) setPending(false); }
  }
  if (invitation) return <div className="mt-5 space-y-4"><p role="status" className={styles.status}>{m.created}</p><InvitationActions url={invitation.url} locale={props.locale} /><TextLink href={href(props.locale, "/my/pairing")} prefetch={false}>{pairingUiMessages[props.locale].center}</TextLink></div>;
  return <div className="space-y-5" data-compare-consent={props.kind}>
    <PreferenceSummary snapshot={props.snapshot} locale={props.locale} title={m.you} />
    <p className="text-sm">{props.kind === "host" ? m.hostConsent : m.guestConsent}</p><p className="text-xs text-mist">{props.kind === "host" ? m.hostConsentDetail : m.guestConsentDetail}</p>
    {props.kind === "host" && <div>
      <label htmlFor="host-note" className="block text-sm">{m.hostNoteLabel}</label>
      <input id="host-note" type="text" value={note} disabled={pending} maxLength={HOST_NOTE_MAX}
        onChange={(event) => setNote(event.target.value)} placeholder={m.hostNotePlaceholder}
        className="mt-2 block min-h-11 w-full rounded-[4px] border border-line bg-card px-4 text-sm outline-none placeholder:text-mist focus-visible:border-warm" />
      <p className="mt-2 text-xs text-mist">{m.hostNoteHint(HOST_NOTE_MAX)}</p>
    </div>}
    <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={pending} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-ink" />{m.agree}</label>
    <p role="status" className="text-sm">{error || (pending ? m.generating : "")}</p><button type="button" className="pill min-h-11 w-full disabled:opacity-40" disabled={!consent || pending} onClick={submit}>{pending ? m.generating : props.kind === "host" ? pairingMessages[props.locale].hostAgree : pairingMessages[props.locale].guestAgree}</button>
    <TextLink href={href(props.locale, "/my/pairing")} prefetch={false}>{pairingUiMessages[props.locale].center}</TextLink>
    <noscript><p>{share.noJs}</p></noscript>
  </div>;
}
