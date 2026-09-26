"use client";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PaymentSheet } from "@/components/payment/payment-sheet";
import type { Locale } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import { compareMessages } from "@/lib/i18n/messages/compare";
import type { CryptoNetwork } from "@/lib/payments/types";
import type { PaymentMode } from "@/lib/site";

/** Price and checkout settings for 请 TA, resolved on the server for the host's language. */
export type GiftCheckout = { priceLabel: string; mode: PaymentMode; networks?: readonly CryptoNetwork[]; available: number };

type Props = {
  invitationId: string;
  /** The host's own result the invitation was made from; the gift order carries it. */
  resultId: string;
  locale: Locale;
  covered: boolean;
  checkout: GiftCheckout;
  /** Reopens the sheet after WeChat authorisation returns with `?gift=<invitationId>`. */
  autoOpen?: boolean;
  /**
   * Inside another sheet, buying leads here instead (the pairing center with `?gift=`), so a payment
   * sheet never opens on top of the invitation sheet — nested drawers misbehave on phones.
   */
  checkoutHref?: string;
};

/**
 * 请 TA on one open invitation. Covered: says so. Otherwise it offers the host's unused gift first
 * (no second payment), then a purchase through the shared payment sheet. It is a post-test,
 * owner-only surface, so it may show the price.
 */
export function GiftOffer({ invitationId, resultId, locale, covered: initiallyCovered, checkout, autoOpen = false, checkoutHref }: Props) {
  const g = pairingUiMessages[locale].gift;
  const currency = paymentMessages[locale].currency;
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen && !initiallyCovered && checkout.available === 0);
  const [covered, setCovered] = useState(initiallyCovered);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const paid = useRef(false);
  // A server refresh may bring news of a cover (another tab, a late payment): take it.
  const [lastCovered, setLastCovered] = useState(initiallyCovered);
  if (lastCovered !== initiallyCovered) { setLastCovered(initiallyCovered); setCovered(initiallyCovered); }

  async function attach() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/pair-gifts", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "X-Mirror-Locale": locale }, body: JSON.stringify({ invitationId }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message);
      setCovered(true);
      router.refresh();
    } catch (e) { setError(e instanceof Error && e.message ? e.message : compareMessages[locale].failed); }
    finally { busy.current = false; setPending(false); }
  }
  function change(next: boolean) {
    setOpen(next);
    if (next) return;
    // The sheet shows its own success; the invitation reads as covered once it closes.
    if (paid.current) { setCovered(true); router.refresh(); }
    // Leave the WeChat return marker behind so a refresh does not reopen the sheet.
    const url = new URL(window.location.href);
    if (url.searchParams.has("gift")) { url.searchParams.delete("gift"); window.history.replaceState(null, "", url); }
  }

  if (covered) return <p data-gift="covered" className="flex items-center gap-2 text-sm text-slate"><CheckCircle size={18} weight="fill" className="shrink-0 text-warm-ink" aria-hidden />{g.covered}</p>;
  return <div data-gift="offer" className="border-l-2 border-warm pl-4">
    <p className="text-base font-medium">{g.title}</p>
    <p className="mt-1 text-sm text-mist">{g.description}</p>
    {checkout.available > 0 ? <>
      <p className="mt-2 text-xs text-mist">{g.available(checkout.available)}</p>
      <button type="button" className="text-link font-medium" disabled={pending} onClick={attach}>{pending ? g.attaching : g.attach}<ArrowRight size={15} aria-hidden /></button>
    </> : checkoutHref ? <a href={checkoutHref} className="text-link font-medium">{`${g.cta} · ${currency}${checkout.priceLabel}`}<ArrowRight size={15} aria-hidden /></a>
      : <button type="button" className="text-link font-medium" onClick={() => change(true)}>{`${g.cta} · ${currency}${checkout.priceLabel}`}<ArrowRight size={15} aria-hidden /></button>}
    <p role="status" className="text-sm">{error}</p>
    {checkout.available === 0 && !checkoutHref && <PaymentSheet open={open} onOpenChange={change} gift={{ invitationId }} resultId={resultId} type="" name=""
      priceLabel={checkout.priceLabel} mode={checkout.mode} networks={checkout.networks ? [...checkout.networks] : undefined}
      onUnlocked={() => { paid.current = true; }} />}
  </div>;
}
