"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { cn } from "cn";
import { InvitationEntry, relationshipIcons, useOpenInvitation } from "@/components/compare/invitation-entry";
import { GiftOffer, type GiftCheckout } from "@/components/pairing/gift-offer";
import { PaymentSheet } from "@/components/payment/payment-sheet";
import { trackAttrs } from "@/lib/analytics/events";
import { COMPARE_RELATIONSHIPS, type CompareRelationship } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";

/** An invitation of this result still open for joining (`resultPairingStatus`). */
export type ReportInvitation = { id: string; url: string; relationship: CompareRelationship | null; covered: boolean; expiresAt: string; joined: number };

type Props = {
  resultId: string;
  locale: Locale;
  checkout: Omit<GiftCheckout, "available">;
  availableGifts: number;
  invitations: ReportInvitation[];
  /** `aside`: one button in the desktop sidebar; `panel`: the cards and invitations that close a chapter. */
  variant: "aside" | "panel";
  /** The one island that reopens a gift checkout after WeChat authorisation returns with `?gift=`. */
  resume?: boolean;
};

const noopSubscribe = () => () => {};
const readGiftParam = () => new URLSearchParams(window.location.search).get("gift");

/**
 * Inviting and 请 TA from the paid report, without leaving it. Choosing a relationship opens the
 * invitation sheet with it chosen (relationship → consent → the message to send). 请 TA — here on an
 * open invitation, or straight after creating one — opens the payment sheet this island owns, after
 * the invitation sheet has closed, so two sheets never stack.
 */
export function ReportPairing({ resultId, locale, checkout, availableGifts, invitations, variant, resume = false }: Props) {
  const router = useRouter();
  const t = pairingUiMessages[locale].reportInvite;
  const [sheet, setSheet] = useState<{ id: string; open: boolean } | null>(null);
  const [resumed, setResumed] = useState(false);
  const paid = useRef(false);
  const returned = useSyncExternalStore(noopSubscribe, readGiftParam, () => null);
  const resumable = resume && !resumed && returned && invitations.some((item) => item.id === returned && !item.covered) ? returned : null;
  const current = sheet ?? (resumable ? { id: resumable, open: true } : null);

  // Let the invitation sheet finish leaving before the payment sheet arrives.
  const openGift = (id: string, afterSheet = false) => {
    if (afterSheet) window.setTimeout(() => setSheet({ id, open: true }), 280);
    else setSheet({ id, open: true });
  };
  const close = () => {
    if (current) setSheet({ id: current.id, open: false });
    setResumed(true);
    const url = new URL(window.location.href);
    if (url.searchParams.has("gift")) { url.searchParams.delete("gift"); window.history.replaceState(null, "", url); }
    if (paid.current) { paid.current = false; router.refresh(); }
  };
  const giftCheckout = { ...checkout, available: availableGifts };

  return (
    <>
      <InvitationEntry resultId={resultId} locale={locale} gift={checkout} surface="report" onGift={(id) => openGift(id, true)}>
        {variant === "aside"
          ? <AsideActions locale={locale} invitations={invitations} checkout={giftCheckout} onGift={openGift} />
          : <PanelActions locale={locale} resultId={resultId} invitations={invitations} checkout={giftCheckout} onGift={openGift} />}
      </InvitationEntry>
      {current && (
        <PaymentSheet
          open={current.open}
          onOpenChange={(next) => { if (!next) close(); }}
          gift={{ invitationId: current.id, backLabel: t.giftBack }}
          resultId={resultId}
          type=""
          name=""
          priceLabel={checkout.priceLabel}
          mode={checkout.mode}
          networks={checkout.networks ? [...checkout.networks] : undefined}
          onUnlocked={() => { paid.current = true; }}
        />
      )}
    </>
  );
}

type ActionProps = { locale: Locale; invitations: ReportInvitation[]; checkout: GiftCheckout; onGift: (id: string) => void };

/** The sidebar: one button that opens the sheet, and 请 TA for the newest invitation not yet covered. */
function AsideActions({ locale, invitations, checkout, onGift }: ActionProps) {
  const open = useOpenInvitation();
  const t = pairingUiMessages[locale].reportInvite;
  const uncovered = invitations.find((item) => !item.covered);
  return (
    <div className="space-y-3">
      <button type="button" className="pill min-h-11 px-4 text-sm" onClick={() => open()} {...trackAttrs("invite_pairing", "report_aside")}>
        {invitations.length ? t.pickAnother : t.invite}
        <ArrowRight size={17} weight="light" aria-hidden />
      </button>
      {uncovered && (
        <button type="button" className="text-link font-medium" onClick={() => onGift(uncovered.id)}>
          {t.giftTitle(`${paymentMessages[locale].currency}${checkout.priceLabel}`)}
          <ArrowRight size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}

/** The chapter card: open invitations with 请 TA on each, then who else to invite. */
function PanelActions({ locale, resultId, invitations, checkout, onGift }: ActionProps & { resultId: string }) {
  const open = useOpenInvitation();
  const t = pairingUiMessages[locale].reportInvite;
  const m = compareMessages[locale];
  const date = (iso: string) => new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
  const invited = new Set(invitations.map((item) => item.relationship));
  const pickId = useId();
  return (
    <div>
      {invitations.length > 0 && (
        <ul className="mb-8 border-b border-line" data-report-invitations>
          {invitations.map((item) => {
            const Glyph = item.relationship ? relationshipIcons[item.relationship] : CheckCircle;
            return (
              <li key={item.id} className="border-line py-5 not-first:border-t first:pt-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-8">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-base font-medium">
                    <Glyph size={20} weight="light" aria-hidden className="shrink-0 text-warm-ink" />
                    {item.relationship ? m.titleFor(m.relationshipLabels[item.relationship]) : pairingUiMessages[locale].reportInvite.eyebrow}
                  </p>
                  <p className="mt-1 text-xs text-mist">{item.joined ? t.rowJoined(item.joined) : t.rowWaiting} · {t.rowExpires(date(item.expiresAt))}</p>
                  <button type="button" className="text-link font-medium" onClick={() => open(item.relationship)} {...trackAttrs("invite_pairing", "report_invite")}>
                    {t.send}
                    <ArrowRight size={15} aria-hidden />
                  </button>
                </div>
                <div className="mt-2 md:mt-0">
                  <GiftOffer invitationId={item.id} resultId={resultId} locale={locale} covered={item.covered} checkout={checkout} onCheckout={() => onGift(item.id)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p id={pickId} className="text-base font-medium">{invitations.length ? t.pickAnother : t.pick}</p>
      <ul aria-labelledby={pickId} data-relationship-cards className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {COMPARE_RELATIONSHIPS.map((relationship) => {
          const Glyph = relationshipIcons[relationship];
          const done = invited.has(relationship);
          return (
            <li key={relationship}>
              <button
                type="button"
                onClick={() => open(relationship)}
                className={cn(
                  "group flex h-full w-full flex-col items-start gap-2 rounded-[4px] border bg-paper p-4 text-left transition-colors duration-150 motion-reduce:transition-none",
                  done ? "border-warm" : "border-line hover:border-ink",
                )}
                {...trackAttrs("invite_pairing", "report_invite")}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <Glyph size={24} weight="light" aria-hidden className="text-warm-ink" />
                  {done
                    ? <span className="flex items-center gap-1 text-xs text-warm-ink"><CheckCircle size={14} weight="fill" aria-hidden />{t.invited}</span>
                    : <ArrowRight size={15} aria-hidden className="text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ink motion-reduce:transition-none" />}
                </span>
                <span className="text-base font-medium">{m.relationshipLabels[relationship]}</span>
                <span className="text-xs text-mist">{t.topic(m.byRelationship[relationship].topic.title)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
