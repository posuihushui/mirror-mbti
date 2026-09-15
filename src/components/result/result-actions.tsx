"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { PaymentSheet } from "@/components/payment/payment-sheet";
import { writeLastResultId } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
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
  clear: boolean;
  /** Which slot this instance renders: the desktop panel button or the phone dock. */
  slot: "panel" | "dock";
};

/**
 * Unlock / read CTA for the result page. The payment sheet is owned by the "dock" instance
 * (mounted once); the "panel" instance only triggers it through the `?unlock=1` search param.
 */
export function ResultActions({ resultId, type, name, priceLabel, mode, networks, owner, unlocked, clear, slot }: Props) {
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
  const canPay = owner && clear && !isUnlocked;

  const setOpen = (next: boolean) => {
    if (next) {
      router.replace(`${pathname}?unlock=1`, { scroll: false });
      return;
    }
    router.replace(pathname, { scroll: false });
    // The server still holds the old `unlocked` prop after a successful payment; refresh it once the sheet closes.
    if (unlockedNow && !unlocked) router.refresh();
  };

  const dockClass = slot === "dock" ? "min-h-[51px] px-[17px] text-[12px]" : undefined;
  let button: React.ReactNode;
  if (isUnlocked) {
    button = (
      <PrimaryButton href={readHref} light={slot === "panel"} className={dockClass}>
        {slot === "panel" ? t.readFull : t.read}
      </PrimaryButton>
    );
  } else if (canPay) {
    button = (
      <PrimaryButton onClick={() => setOpen(true)} light={slot === "panel"} className={dockClass}>
        {t.unlock}
      </PrimaryButton>
    );
  } else {
    button = (
      <PrimaryButton href={href(locale, "/quiz")} light={slot === "panel"} className={dockClass}>
        {t.startMine}
      </PrimaryButton>
    );
  }

  if (slot === "panel") return button;

  return (
    <>
      <Dock>
        <div className="flex items-center gap-5">
          <div className="min-w-[101px]">
            <small className="block text-[9px] text-[#839199]">{t.dockLabel}</small>
            <strong className="mt-[3px] block text-[25px] leading-[1.1] font-medium tracking-[-1px]">
              {messages.currency}{priceLabel}
              <span className="text-[10px] font-normal tracking-normal text-[#8a989e]">{t.perTime}</span>
            </strong>
          </div>
          {button}
        </div>
      </Dock>
      {owner && clear && (
        <PaymentSheet
          open={open && !unlocked}
          onOpenChange={setOpen}
          resultId={resultId}
          type={type}
          name={name}
          priceLabel={priceLabel}
          mode={mode}
          networks={networks ? [...networks] : undefined}
          onUnlocked={() => setUnlockedNow(true)}
          onRead={() => router.push(readHref)}
        />
      )}
    </>
  );
}
