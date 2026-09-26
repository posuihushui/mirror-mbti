"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { PaymentSheet } from "@/components/payment/payment-sheet";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { writeLastResultId } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { resultMessages } from "@/lib/i18n/messages/result";
import type { CryptoNetwork } from "@/lib/payments/types";
import type { PaymentMode } from "@/lib/site";

type Props = {
  resultId: string;
  type: string;
  name: string;
  priceLabel: string;
  mode: PaymentMode;
  /** Crypto mode: networks configured on the server. */
  networks?: readonly CryptoNetwork[];
  owner: boolean;
  unlocked: boolean;
  syncing?: boolean;
  /**
   * Which slot this instance renders: the desktop button in the dark panel, the right end of the
   * sticky section nav (desktop), or the phone dock. Only the dock instance owns the payment sheet.
   */
  slot: "panel" | "nav" | "dock";
  /**
   * The join page of an invitation whose host covered this reader's report. Joining opens the report,
   * so it replaces the price in every slot; buying one's own stays available from the panel.
   */
  covered?: string;
};

/**
 * Unlock / read CTA for the result page. The payment sheet is owned by the "dock" instance
 * (mounted once); the "panel" instance only triggers it through the `?unlock=1` search param.
 */
export function ResultActions({ resultId, type, name, priceLabel, mode, networks, owner, unlocked, syncing = false, slot, covered }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const messages = resultMessages[locale];
  const t = messages.actions;
  const [unlockedNow, setUnlockedNow] = useState(unlocked);
  const open = searchParams.get("unlock") === "1";

  useEffect(() => {
    if (owner) writeLastResultId(resultId);
  }, [owner, resultId]);

  const readHref = href(locale, `/report/${resultId}`);
  const isUnlocked = unlocked || unlockedNow;
  const canPay = owner && !isUnlocked && !syncing;

  const setOpen = (next: boolean) => {
    const query = new URLSearchParams(searchParams.toString());
    if (next) {
      query.set("unlock", "1");
      router.replace(`${pathname}?${query}`, { scroll: false });
      return;
    }
    track("checkout_close", { payment_mode: mode, completed: unlockedNow });
    query.delete("unlock");
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
    // The server still holds the old `unlocked` prop after a successful payment; refresh it once the sheet closes.
    if (unlockedNow && !unlocked) router.refresh();
  };

  const dockClass = slot === "dock" ? "min-h-[52px] px-5 text-sm" : slot === "nav" ? "min-h-11 w-auto gap-3 px-5 text-sm" : undefined;
  const trackLocation = slot === "panel" ? "result_panel" : slot === "nav" ? "result_nav" : "dock";
  let button: React.ReactNode;
  const gift = pairingUiMessages[locale].gift;
  if (isUnlocked) {
    button = (
      <PrimaryButton href={readHref} light={slot === "panel"} className={dockClass} {...trackAttrs("read_report", trackLocation)}>
        {slot === "dock" ? t.read : t.readFull}
      </PrimaryButton>
    );
  } else if (canPay && covered) {
    button = (
      <PrimaryButton href={covered} prefetch={false} light={slot === "panel"} className={dockClass} {...trackAttrs("accept_covered", trackLocation)}>
        {gift.accept}
      </PrimaryButton>
    );
  } else if (canPay) {
    button = (
      <PrimaryButton onClick={() => setOpen(true)} light={slot === "panel"} className={dockClass} {...trackAttrs("unlock_report", trackLocation)}>
        {slot === "panel" ? t.unlock : pairingUiMessages[locale].unlockShort}
      </PrimaryButton>
    );
  } else if (syncing) {
    button = <span role="status" className="text-xs">{pairingUiMessages[locale].syncing}</span>;
  } else {
    button = (
      <PrimaryButton href={href(locale, "/quiz")} light={slot === "panel"} className={dockClass} {...trackAttrs("start_quiz", trackLocation)}>
        {t.startMine}
      </PrimaryButton>
    );
  }

  // The nav names the price beside its button, as the dock does, so the report is an offer at every scroll depth.
  if (slot === "nav") {
    return canPay && !covered ? (
      <div className="flex items-center gap-4">
        <strong className="text-xl font-normal tracking-tight whitespace-nowrap">
          <small className="mr-0.5 text-sm">{messages.currency}</small>
          {priceLabel}
        </strong>
        {button}
      </div>
    ) : button;
  }
  if (slot !== "dock") return button;

  return (
    <>
      <Dock>
        <div className="flex w-full min-w-0 items-center gap-3">
          {!isUnlocked && !syncing && covered && <p className="flex min-w-[88px] items-center gap-2 text-xs text-slate"><CheckCircle size={18} weight="fill" className="shrink-0 text-warm-ink" aria-hidden />{gift.dockLabel}</p>}
          {!isUnlocked && !syncing && !covered && <div className="min-w-[88px]">
            <small className="block text-xs text-mist">{t.dockLabel}</small>
            <strong className="mt-0.5 block text-2xl leading-tight font-medium tracking-tight">
              {messages.currency}{priceLabel}
              <span className="text-xs font-normal tracking-normal text-mist">{t.perTime}</span>
            </strong>
          </div>}
          <div className="min-w-0 flex-1">{button}</div>
          {isUnlocked && <TextLink prefetch={false} className="shrink-0 text-sm" href={href(locale, `/my/pairing?result=${resultId}`)}>{pairingUiMessages[locale].inviteShort}</TextLink>}
        </div>
      </Dock>
      {owner && !syncing && (
        <PaymentSheet
          open={open}
          initiallyUnlocked={isUnlocked}
          onOpenChange={setOpen}
          resultId={resultId}
          type={type}
          name={name}
          priceLabel={priceLabel}
          mode={mode}
          networks={networks ? [...networks] : undefined}
          onUnlocked={() => setUnlockedNow(true)}
        />
      )}
    </>
  );
}
