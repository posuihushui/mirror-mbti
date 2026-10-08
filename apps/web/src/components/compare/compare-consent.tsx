"use client";
import { Eye, EyeSlash, PencilSimpleLine } from "@phosphor-icons/react";
import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { categoryMirrorProfile } from "@/components/brand/mirror-mark";
import { Illustration } from "@/components/illustrations/scene";
import { relationshipScenes } from "@/components/illustrations/moment-scenes";
import { PairMarks } from "@/components/pairing/pair-figures";
import { href, type Locale } from "@/lib/i18n/locale";

import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { InvitationActions } from "@/components/pairing/invitation-actions";
import styles from "@/components/pairing/pairing.module.css";
import { shareMessages } from "@/lib/i18n/messages/share";
import { COMPARE_GUEST_CONSENT_VERSION, COMPARE_HOST_CONSENT_VERSION, HOST_NOTE_MAX, type CompareRelationship, type CompareSnapshot } from "@/lib/compare-types";
import { PreferenceSummary, testedOn } from "./preference-summary";

const DIMENSIONS = ["EI", "SN", "TF", "JP"] as const;

type Host = { kind: "host"; resultId: string; shareId?: string; relationship: CompareRelationship; onCreated?: (invitation: Created) => void };
/** `covered`: the host covered a report on this invitation, and this participant's is still locked. */
type Guest = { kind: "guest"; invitationToken: string; resultId: string; covered?: boolean };
type Props = { locale: Locale; snapshot: CompareSnapshot } & (Host | Guest);
export type Created = { id: string; url: string; covered: boolean };

export function CompareConsent(props: Props) {
  const m = compareMessages[props.locale];
  const share = shareMessages[props.locale];
  const ui = pairingUiMessages[props.locale];
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<Created | null>(null);
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
      const body = props.kind === "host"
        ? { resultId: props.resultId, ...(props.shareId ? { shareId: props.shareId } : {}), ...(note.trim() ? { hostNote: note } : {}), relationship: props.relationship, consentVersion: COMPARE_HOST_CONSENT_VERSION, requestId: requestId.current }
        : { invitationToken: props.invitationToken, resultId: props.resultId, consentVersion: COMPARE_GUEST_CONSENT_VERSION };
      const response = await fetch(props.kind === "host" ? "/api/comparison-invitations" : "/api/comparisons", { method: "POST", cache: "no-store", signal: abort.signal, headers: { "Content-Type": "application/json", "X-Mirror-Locale": props.locale }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!active.current) return;
      if (!response.ok || !json.ok) { setError(json.error?.message ?? m.failed); return; }
      if (props.kind === "host") { setInvitation(json.data); props.onCreated?.(json.data); }
      else window.location.assign(json.data.url);
    } catch { if (active.current) setError(m.failed); }
    finally { clearTimeout(timeout); busy.current = false; if (active.current) setPending(false); }
  }
  if (invitation && props.kind === "host") return <div className="mt-5 space-y-5">
    <p role="status" className={styles.status}>{m.created}</p>
    <InvitationActions url={invitation.url} locale={props.locale} relationship={props.relationship} />
    <TextLink href={href(props.locale, "/my/pairing")} prefetch={false}>{ui.center}</TextLink>
  </div>;
  const actions = <>
    <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={pending} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-ink" />{m.agree}</label>
    <p role="status" className="text-sm">{error || (pending ? m.generating : "")}</p><button type="button" className="pill min-h-11 w-full disabled:opacity-40" disabled={!consent || pending} onClick={submit}>{pending ? m.generating : props.kind === "host" ? pairingMessages[props.locale].hostAgree : pairingMessages[props.locale].guestAgree}</button>
  </>;
  /*
   * The host's consent, drawn as what the other person will open: their own side (the card, with the
   * note written where it will appear) and what stays private, then the guide for two, which waits for
   * the other person's answers. The consent line names every published item beside the card.
   */
  if (props.kind === "host") {
    const t = ui.inviteSheet;
    const categories = props.snapshot.categories;
    const part = (n: number, id: string, title: string, tag: ReactNode) => <p id={id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
      <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-ink text-xs text-paper">{n}</span>{title}
      <span className="ml-auto flex items-center gap-1 text-xs font-normal text-mist">{tag}</span>
    </p>;
    return <div className="space-y-6" data-compare-consent="host">
      <p data-stage-focus tabIndex={-1} className="text-lg font-medium outline-none">{t.seesTitle}</p>
      <section aria-labelledby="invite-side" data-invite-part="side">
        {part(1, "invite-side", t.sideTitle, <><Eye size={14} aria-hidden />{t.sideTag}</>)}
        <div className="mt-3 rounded-[4px] border border-line bg-card p-4">
          <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-3">
            <Illustration scene={relationshipScenes[props.relationship]} className="w-[4.25rem]" />
            <div className="min-w-0">
              <p className="text-xs text-warm-ink">{m.relationshipBetween[props.relationship]}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1">{DIMENSIONS.map((dimension) => <li key={dimension} className="flex items-baseline gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-sm">
                {categories[dimension] !== "balanced" && <span aria-hidden className="text-xs text-mist">{categories[dimension]}</span>}{m.categoryLabels[categories[dimension]]}
              </li>)}</ul>
              <p className="mt-1.5 text-xs text-mist">{testedOn(props.snapshot, props.locale)}</p>
            </div>
          </div>
          {/* The note sits where the other person will read it: a speech bubble on their page. */}
          <label className="mt-3 flex min-h-11 items-center gap-2 rounded-[16px_16px_16px_4px] border border-dashed border-line bg-paper px-3.5 focus-within:border-warm-ink">
            <PencilSimpleLine size={16} aria-hidden className="shrink-0 text-mist" />
            <span className="sr-only">{m.hostNoteLabel}</span>
            <input id="host-note" type="text" value={note} disabled={pending} maxLength={HOST_NOTE_MAX}
              onChange={(event) => setNote(event.target.value)} placeholder={m.hostNotePlaceholder}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-mist" />
            <span aria-hidden className="text-xs text-mist tabular-nums">{note.length}/{HOST_NOTE_MAX}</span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-mist">
          <EyeSlash size={14} aria-hidden />{t.hiddenTitle}
          <ul className="contents">{t.hidden.map((item) => <li key={item} className="rounded-full bg-mist/10 px-2.5 py-0.5 line-through decoration-mist/60">{item}</li>)}</ul>
        </div>
      </section>
      <section aria-labelledby="invite-pair" data-invite-part="pair">
        {part(2, "invite-pair", t.pairTitle, t.pairTag)}
        <div className="mt-3 flex items-center gap-4 rounded-[4px] border border-dashed border-line p-4">
          <PairMarks you={categoryMirrorProfile([categories.EI, categories.SN, categories.TF, categories.JP])} partner={null} labels={[ui.reportInvite.you, ui.reportInvite.them]} size={34} className="shrink-0" />
          <p className="text-xs text-slate">{t.pairBody}</p>
        </div>
      </section>
      <p className="text-xs text-mist">{m.hostConsentDetail}</p>
      {actions}
      <noscript><p>{share.noJs}</p></noscript>
    </div>;
  }
  return <div className="space-y-5" data-compare-consent={props.kind}>
    <PreferenceSummary snapshot={props.snapshot} locale={props.locale} title={m.you} />
    <p className="text-sm">{m.guestConsent}</p><p className="text-xs text-mist">{m.guestConsentDetail}</p>
    {props.covered && <p data-gift="consent" className="border-l-2 border-warm pl-4 text-sm">{ui.gift.consent}</p>}
    {actions}
    <TextLink href={href(props.locale, "/my/pairing")} prefetch={false}>{ui.center}</TextLink>
    <noscript><p>{share.noJs}</p></noscript>
  </div>;
}
