"use client";
import { ArrowRight, BookOpenText, Briefcase, Check, Eye, Heart, HouseLine, LinkSimple, PaperPlaneTilt, Smiley, Timer, type Icon } from "@phosphor-icons/react";
import { cn } from "cn";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { href, type Locale } from "@/lib/i18n/locale";
import { COMPARE_RELATIONSHIPS, type CompareRelationship, type CompareSnapshot } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { TextLink } from "@/components/site/text-link";
import { Illustration } from "@/components/illustrations/scene";
import { relationshipScenes } from "@/components/illustrations/moment-scenes";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { InvitationActions } from "@/components/pairing/invitation-actions";
import { GiftOffer, type GiftCheckout } from "@/components/pairing/gift-offer";
import { emitPairingEvent } from "@/lib/pairing-tracking";
import styles from "@/components/pairing/pairing.module.css";
import { CompareConsent } from "./compare-consent";

type ActiveInvitation = { id: string; url: string; relationship: CompareRelationship | null; covered: boolean };
type Options = { snapshot: CompareSnapshot; activeInvitations: ActiveInvitation[]; availableGifts: number };

export const relationshipIcons: Record<CompareRelationship, Icon> = { partner: Heart, friend: Smiley, family: HouseLine, colleague: Briefcase };

/** Opens the entry's sheet from anywhere inside its custom trigger, optionally with a relationship chosen. */
const OpenInvitation = createContext<(relationship?: CompareRelationship | null) => void>(() => {});
export function useOpenInvitation() { return useContext(OpenInvitation); }

/** 0: who it is for; 1: what the other person will see (the host's consent); 2: sending it. */
type Stage = 0 | 1 | 2;
const stepIcons = [Heart, Eye, PaperPlaneTilt];

/**
 * Where the sheet stands. Once chosen, the first step names the relationship and takes the host back
 * to the picker; the second reads as confirmed once an invitation exists.
 */
function InviteSteps({ locale, stage, relationship, onBack }: { locale: Locale; stage: Stage; relationship: CompareRelationship | null; onBack: () => void }) {
  const t = pairingUiMessages[locale].inviteSheet;
  const done = pairingUiMessages[locale].reportInvite.done;
  const label = (i: number) => i === 0 && stage > 0 && relationship ? compareMessages[locale].relationshipLabels[relationship] : i === 1 && stage > 1 ? t.confirmed : t.steps[i];
  return <ol className="relative grid grid-cols-3 gap-2" data-invite-steps={stage}>
    <span aria-hidden className="absolute top-4 right-[16.7%] left-[16.7%] h-px bg-line" />
    <span aria-hidden className="absolute top-4 left-[16.7%] h-px bg-warm transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${stage * 33.3}%` }} />
    {t.steps.map((step, i) => {
      const passed = i < stage;
      const current = i === stage;
      const Glyph = stepIcons[i];
      const content = <>
        <span aria-hidden className={cn("flex size-8 items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none",
          passed ? "border-warm bg-warm text-paper" : current ? "border-warm bg-paper text-warm-ink ring-4 ring-warm/15" : "border-line bg-paper text-mist")}>
          {passed ? <Check size={14} weight="bold" /> : <Glyph size={16} weight="light" />}
        </span>
        <span className={cn("text-xs text-balance", current ? "font-medium text-ink" : "text-mist", passed && i === 0 && "underline decoration-line underline-offset-4")}>
          {label(i)}{passed && <span className="sr-only"> · {done}</span>}
        </span>
      </>;
      return <li key={step} aria-current={current ? "step" : undefined} className="relative flex justify-center">
        {passed && i === 0
          ? <button type="button" onClick={onBack} aria-label={t.change(label(0))} className="flex min-h-11 flex-col items-center gap-1.5 text-center">{content}</button>
          : <span className="flex flex-col items-center gap-1.5 text-center">{content}</span>}
      </li>;
    })}
  </ol>;
}

/**
 * The first choice of an invitation: who it is for, each relationship pictured by its moment. A
 * radiogroup, never role="group", so it cannot be mistaken for the quiz's answer group. Partner leads;
 * nothing is chosen for the host. A tap (or Enter / Space) chooses and moves on; arrow keys only move
 * the selection, so browsing with the keyboard never skips ahead.
 */
function RelationshipPicker({ locale, value, onChange, disabled }: { locale: Locale; value: CompareRelationship | null; onChange: (value: CompareRelationship, advance: boolean) => void; disabled?: boolean }) {
  const m = compareMessages[locale];
  const pointer = useRef(false);
  return <div>
    <p id="relationship-pick" data-stage-focus tabIndex={-1} className="text-lg font-medium outline-none">{m.relationshipPick}</p>
    <p className="mt-1 text-xs text-mist">{m.relationshipHint}</p>
    <div role="radiogroup" aria-labelledby="relationship-pick" className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4" data-relationship-picker>
      {COMPARE_RELATIONSHIPS.map((relationship) => {
        const checked = value === relationship;
        return <label key={relationship} onPointerDown={() => { pointer.current = true; }}
          className={cn("relative flex cursor-pointer flex-col items-center gap-1.5 rounded-[4px] border bg-card px-2 py-3 text-base font-medium transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-warm-ink motion-reduce:transition-none",
            checked ? "border-ink" : "border-line hover:border-ink", disabled && "cursor-wait opacity-60")}>
          <input type="radio" name="relationship" value={relationship} checked={checked} disabled={disabled} className="sr-only"
            onClick={() => { const advance = pointer.current; pointer.current = false; onChange(relationship, advance); }}
            onChange={() => onChange(relationship, false)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChange(relationship, true); } }} />
          <Illustration scene={relationshipScenes[relationship]} className="w-full max-w-28" />
          {m.relationshipLabels[relationship]}
          {checked && <span aria-hidden className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-warm text-paper"><Check size={11} weight="bold" /></span>}
        </label>;
      })}
    </div>
  </div>;
}

/** What happens once the link is sent, drawn as three stops. */
function NextSteps({ locale }: { locale: Locale }) {
  const t = pairingUiMessages[locale].inviteSheet;
  const icons = [LinkSimple, Timer, BookOpenText];
  return <div>
    <p className="text-xs text-mist">{t.next}</p>
    <ol className="relative mt-3 grid grid-cols-3 gap-2">
      <span aria-hidden className="absolute top-[1.125rem] right-[16.7%] left-[16.7%] border-t border-dashed border-line" />
      {t.nextSteps.map((step, i) => {
        const Glyph = icons[i];
        return <li key={step} className="relative flex flex-col items-center gap-1.5 text-center text-xs text-balance text-slate">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full border border-line bg-card text-warm-ink"><Glyph size={17} weight="light" /></span>
          {step}
        </li>;
      })}
    </ol>
  </div>;
}

type EntryProps = {
  resultId: string;
  shareId?: string;
  locale: Locale;
  gift?: Omit<GiftCheckout, "available">;
  /** Where the entry sits, for the pairing funnel. */
  surface?: "my_pairing" | "report";
  /**
   * Replaces the default button. Anything inside can open the sheet through `useOpenInvitation()`,
   * with the relationship the reader picked on it — so nothing is chosen for them.
   */
  children?: ReactNode;
  /**
   * 请 TA without leaving the page: the sheet closes and the parent opens the payment sheet, so the
   * two never stack. Without it, buying leads to the pairing center.
   */
  onGift?: (invitationId: string) => void;
};

/**
 * The invitation sheet, in three steps: who it is for → what the other person will see (the host's
 * own side, which they publish, and the guide for two, which waits for the other person) → the link
 * to send. A relationship chosen on the page opens it at the second step.
 */
export function InvitationEntry({ resultId, shareId, locale, gift, surface = "my_pairing", children, onGift }: EntryProps) {
  const m = compareMessages[locale];
  const ui = pairingUiMessages[locale];
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Options | null>(null);
  const [relationship, setRelationship] = useState<CompareRelationship | null>(null);
  const [picking, setPicking] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  // Set when the host moves between steps, so focus follows into the new step (not on opening).
  const moved = useRef(false);
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);
  async function load() {
    request.current?.abort();
    const current = ++sequence.current;
    const abort = new AbortController(); request.current = abort;
    const timeout = setTimeout(() => abort.abort(), 10000);
    setOptions(null); setError("");
    try {
      const response = await fetch(`/api/comparison-invitations/options?resultId=${encodeURIComponent(resultId)}${shareId ? `&shareId=${encodeURIComponent(shareId)}` : ""}`, { cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: abort.signal });
      const body = await response.json();
      if (current !== sequence.current) return;
      if (!response.ok || !body.ok) { setError(body.error?.message ?? m.failed); return; }
      setOptions(body.data);
    } catch { if (current === sequence.current) setError(m.failed); }
    finally { clearTimeout(timeout); }
  }
  function change(open: boolean, chosen: CompareRelationship | null = null) {
    setOpen(open);
    if (open) { opener.current = document.activeElement as HTMLElement | null; setRelationship(chosen); setPicking(!chosen); setCreated([]); emitPairingEvent("pairing_entry_clicked", resultId, surface); void load(); return; }
    sequence.current++; request.current?.abort();
    // A new invitation changes what the page around the entry says (the report's card, the center's list).
    if (created.length) router.refresh();
    const back = opener.current ?? trigger.current;
    requestAnimationFrame(() => back?.focus());
  }
  function choose(next: CompareRelationship, advance: boolean) {
    setRelationship(next);
    if (advance) { moved.current = true; setPicking(false); }
  }
  function backToPicker() { moved.current = true; setPicking(true); }
  function giftFrom(invitationId: string) { change(false); onGift?.(invitationId); }
  // Created in this sheet: switching relationships and back shows it rather than a second consent.
  const [created, setCreated] = useState<ActiveInvitation[]>([]);
  const existing = options && relationship ? [...created, ...options.activeInvitations].find((item) => item.relationship === relationship) : undefined;
  const checkout = gift && options ? { ...gift, available: options.availableGifts } : undefined;
  const stage: Stage = !relationship || picking ? 0 : existing ? 2 : 1;
  useEffect(() => {
    if (!moved.current || !body.current) return;
    moved.current = false;
    // Each step starts from the top of the sheet, steps included; focus follows without scrolling past them.
    for (let node = body.current.parentElement; node; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY)) { node.scrollTop = 0; break; }
    }
    body.current.querySelector<HTMLElement>("[data-stage-focus]")?.focus({ preventScroll: true });
  }, [stage]);
  const status = !options && <><p role="status" className="text-sm text-mist">{error || m.preparing}</p>{error && <button type="button" className="pill mt-5 min-h-11" onClick={load}>{m.retry}</button>}</>;
  return <>{children ? <OpenInvitation value={(chosen) => change(true, chosen ?? null)}>{children}</OpenInvitation> : <button ref={trigger} type="button" className="pill min-h-[52px] md:w-auto md:min-w-60" onClick={() => change(true)}>{ui.invite}<ArrowRight size={19} weight="light" aria-hidden /></button>}<ResponsiveSheet open={open} onOpenChange={change} title={m.create} description={m.createSheetDescription} hideDescription closeLabel={shareMessages[locale].close}>{open && <div ref={body} className="mt-5 space-y-6" data-invite-stage={stage}>
    <InviteSteps locale={locale} stage={stage} relationship={relationship} onBack={backToPicker} />
    {stage === 0 ? <><RelationshipPicker locale={locale} value={relationship} onChange={choose} disabled={!options} />{status}</>
      : !options ? status
        : existing ? <div className="space-y-6">
          {created.includes(existing)
            ? <p role="status" data-stage-focus tabIndex={-1} className={cn(styles.status, "flex items-center gap-2 text-lg font-medium outline-none")}><span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warm text-paper"><Check size={13} weight="bold" /></span>{m.created}</p>
            : <p data-stage-focus tabIndex={-1} className="text-lg font-medium outline-none">{ui.existing}</p>}
          <InvitationActions key={existing.id} url={existing.url} locale={locale} relationship={relationship} />
          <NextSteps locale={locale} />
          {checkout && <GiftOffer invitationId={existing.id} resultId={resultId} locale={locale} covered={existing.covered} checkout={checkout} {...(onGift ? { onCheckout: () => giftFrom(existing.id) } : { checkoutHref: href(locale, `/my/pairing?gift=${existing.id}`) })} />}
          <TextLink href={href(locale, "/my/pairing")} prefetch={false}>{ui.center}</TextLink>
        </div>
          : relationship && <CompareConsent key={relationship} kind="host" resultId={resultId} shareId={shareId} relationship={relationship} locale={locale} snapshot={options.snapshot}
            onCreated={(item) => { moved.current = true; setCreated((list) => [...list.filter((entry) => entry.relationship !== relationship), { ...item, relationship }]); }} />}
  </div>}</ResponsiveSheet></>;
}
