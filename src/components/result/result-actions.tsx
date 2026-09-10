"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { PaymentSheet } from "@/components/payment/payment-sheet";
import { writeLastResultId } from "@/lib/client-storage";
import type { PaymentMode } from "@/lib/site";

type Props = {
  resultId: string;
  type: string;
  name: string;
  priceLabel: string;
  mode: PaymentMode;
  owner: boolean;
  unlocked: boolean;
  /** Which slot this instance renders: the desktop panel button or the phone dock. */
  slot: "panel" | "dock";
};

/**
 * Unlock / read CTA for the result page. The payment sheet is owned by the "dock" instance
 * (mounted once); the "panel" instance only triggers it through the `?unlock=1` search param.
 */
export function ResultActions({ resultId, type, name, priceLabel, mode, owner, unlocked, slot }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unlockedNow, setUnlockedNow] = useState(unlocked);
  const open = searchParams.get("unlock") === "1";

  useEffect(() => {
    if (owner) writeLastResultId(resultId);
  }, [owner, resultId]);

  const readHref = `/report/${resultId}`;
  const isUnlocked = unlocked || unlockedNow;
  const canPay = owner && !isUnlocked;

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
        {slot === "panel" ? "阅读完整报告" : "阅读报告"}
      </PrimaryButton>
    );
  } else if (canPay) {
    button = (
      <PrimaryButton onClick={() => setOpen(true)} light={slot === "panel"} className={dockClass}>
        解锁完整报告
      </PrimaryButton>
    );
  } else {
    button = (
      <PrimaryButton href="/quiz" light={slot === "panel"} className={dockClass}>
        开始我的测试
      </PrimaryButton>
    );
  }

  if (slot === "panel") return button;

  return (
    <>
      <Dock>
        <div className="flex items-center gap-5">
          <div className="min-w-[101px]">
            <small className="block text-[9px] text-[#839199]">完整人格报告</small>
            <strong className="mt-[3px] block text-[25px] leading-[1.1] font-medium tracking-[-1px]">
              ¥{priceLabel}
              <span className="text-[10px] font-normal tracking-normal text-[#8a989e]"> / 次</span>
            </strong>
          </div>
          {button}
        </div>
      </Dock>
      {owner && (
        <PaymentSheet
          open={open && !unlocked}
          onOpenChange={setOpen}
          resultId={resultId}
          type={type}
          name={name}
          priceLabel={priceLabel}
          mode={mode}
          onUnlocked={() => setUnlockedNow(true)}
          onRead={() => router.push(readHref)}
        />
      )}
    </>
  );
}
