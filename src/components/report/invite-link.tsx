"use client";

import { Copy } from "@phosphor-icons/react";
import { useCopy } from "@/hooks/use-copy";
import { track } from "@/lib/analytics/track";
import type { Locale } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";

/**
 * The reader's invite code and its link, for inviting someone to the test without pairing. Copying
 * takes the link alone, for the reader to send in their own words (no prepared message, and so never
 * a price: the invite price shows after the test). Analytics records the copy, never the code (a code
 * ties the orders it priced to one reader).
 */
export function InviteLink({ locale, code, url, invitePrice }: { locale: Locale; code: string; url: string; invitePrice: string }) {
  const t = pairingUiMessages[locale].reportInvite;
  const { status, manual, copy } = useCopy(shareMessages[locale].manualCopy);
  async function copyInvite() {
    await copy(url, t.copiedInvite);
    track("invite_link_copy", { surface: "report" });
  }
  return (
    <div data-invite-code>
      <div className="md:flex md:items-end md:justify-between md:gap-8">
        <div className="min-w-0">
          <p className="text-base font-medium">{t.codeTitle}</p>
          <p className="mt-1 text-sm text-slate">{t.codeBody(invitePrice)}</p>
          <p className="mt-3 text-xs text-mist">{t.codeLabel} <span className="ml-1 text-sm font-medium tracking-widest text-ink">{code}</span></p>
        </div>
        <button type="button" className="text-link mt-3 shrink-0 font-medium md:mt-0" onClick={copyInvite}>
          {t.copyInvite}
          <Copy size={15} aria-hidden />
        </button>
      </div>
      {manual && <p className="mt-3 text-sm break-all text-ink select-all">{url}</p>}
      <p role="status" className="mt-2 text-xs text-mist">{status}</p>
    </div>
  );
}
