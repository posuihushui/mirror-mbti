"use client";
import { ArrowRight, Briefcase, Heart, HouseLine, Smiley, type Icon } from "@phosphor-icons/react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { href, type Locale } from "@/lib/i18n/locale";
import { COMPARE_RELATIONSHIPS, type CompareRelationship, type CompareSnapshot } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
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

/**
 * The first choice of an invitation: who it is for. A radiogroup, never role="group", so it cannot
 * be mistaken for the quiz's answer group. Partner leads; nothing is chosen for the host.
 */
function RelationshipPicker({ locale, value, onChange, disabled }: { locale: Locale; value: CompareRelationship | null; onChange: (value: CompareRelationship) => void; disabled?: boolean }) {
  const m = compareMessages[locale];
  return <div>
    <p id="relationship-pick" className="text-base font-medium">{m.relationshipPick}</p>
    <p className="mt-1 text-xs text-mist">{m.relationshipHint}</p>
    <div role="radiogroup" aria-labelledby="relationship-pick" className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4" data-relationship-picker>
      {COMPARE_RELATIONSHIPS.map((relationship) => {
        const Glyph = relationshipIcons[relationship];
        const checked = value === relationship;
        return <label key={relationship} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[4px] border px-4 text-base transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-warm-ink motion-reduce:transition-none ${checked ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`}>
          <input type="radio" name="relationship" value={relationship} checked={checked} disabled={disabled} onChange={() => onChange(relationship)} className="sr-only" />
          <Glyph size={22} weight={checked ? "fill" : "light"} aria-hidden className={checked ? "text-warm" : "text-warm-ink"} />
          {m.relationshipLabels[relationship]}
        </label>;
      })}
    </div>
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

export function InvitationEntry({ resultId, shareId, locale, gift, surface = "my_pairing", children, onGift }: EntryProps) {
  const m = compareMessages[locale];
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Options | null>(null);
  const [relationship, setRelationship] = useState<CompareRelationship | null>(null);
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
    if (open) { opener.current = document.activeElement as HTMLElement | null; setRelationship(chosen); setCreated([]); emitPairingEvent("pairing_entry_clicked", resultId, surface); void load(); return; }
    sequence.current++; request.current?.abort();
    // A new invitation changes what the page around the entry says (the report's card, the center's list).
    if (created.length) router.refresh();
    const back = opener.current ?? trigger.current;
    requestAnimationFrame(() => back?.focus());
  }
  function giftFrom(invitationId: string) { change(false); onGift?.(invitationId); }
  // Created in this sheet: switching relationships and back shows it rather than a second consent.
  const [created, setCreated] = useState<ActiveInvitation[]>([]);
  const existing = options && relationship ? [...created, ...options.activeInvitations].find((item) => item.relationship === relationship) : undefined;
  const checkout = gift && options ? { ...gift, available: options.availableGifts } : undefined;
  return <>{children ? <OpenInvitation value={(chosen) => change(true, chosen ?? null)}>{children}</OpenInvitation> : <button ref={trigger} type="button" className="pill min-h-[52px] md:w-auto md:min-w-60" onClick={() => change(true)}>{pairingUiMessages[locale].invite}<ArrowRight size={19} weight="light" aria-hidden /></button>}<ResponsiveSheet open={open} onOpenChange={change} title={m.create} description={m.createSheetDescription} closeLabel={shareMessages[locale].close}>{open && <div className="mt-5 space-y-6">
    <RelationshipPicker locale={locale} value={relationship} onChange={setRelationship} disabled={!options} />
    {!options ? <><p role="status">{error || m.preparing}</p>{error && <button type="button" className="pill mt-5 min-h-11" onClick={load}>{m.retry}</button>}</>
      : !relationship ? null
        : existing ? <div className="space-y-5">{created.includes(existing) ? <p role="status" className={styles.status}>{m.created}</p> : <p className="text-sm text-mist">{pairingUiMessages[locale].existing}</p>}<InvitationActions key={existing.id} url={existing.url} locale={locale} relationship={relationship} covered={existing.covered} />{checkout && <GiftOffer invitationId={existing.id} resultId={resultId} locale={locale} covered={existing.covered} checkout={checkout} {...(onGift ? { onCheckout: () => giftFrom(existing.id) } : { checkoutHref: href(locale, `/my/pairing?gift=${existing.id}`) })} />}</div>
          : <CompareConsent key={relationship} kind="host" resultId={resultId} shareId={shareId} relationship={relationship} locale={locale} snapshot={options.snapshot}
            onCreated={(item) => setCreated((list) => [...list.filter((entry) => entry.relationship !== relationship), { ...item, relationship }])} />}
  </div>}</ResponsiveSheet></>;
}
