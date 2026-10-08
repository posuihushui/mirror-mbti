"use client";
import { ArrowRight, Copy } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";
import { Illustration } from "@/components/illustrations/scene";
import { pairScene, relationshipScenes } from "@/components/illustrations/moment-scenes";
import type { Locale } from "@/lib/i18n/locale";
import type { CompareRelationship } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";
import { isWeChat } from "@/lib/ua";
import { useCopy } from "@/hooks/use-copy";

const noopSubscribe = () => () => {};

/**
 * Sending an invitation: the link itself, pictured as what the other person will open (the
 * relationship's scene and the invitation's heading; tapping it previews the page), and one button
 * that copies it. No message is written for the host (owner request, 2026-09-29: a prepared script
 * read as too formal); they say it in their own words. Inside WeChat a hint also points at the ···
 * menu, which shares the invitation page itself once it is open.
 */
export function InvitationActions({ url, locale, relationship = null }: { url: string; locale: Locale; relationship?: CompareRelationship | null }) {
  const inWeChat = useSyncExternalStore(noopSubscribe, () => isWeChat(navigator.userAgent), () => false);
  const m = pairingUiMessages[locale]; const t = m.inviteSheet; const s = shareMessages[locale];
  const { status, manual, copy } = useCopy(s.manualCopy);
  return <div className="space-y-3 print:hidden" data-invitation-actions>
    <a href={url} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] border border-line bg-card p-3 transition-colors duration-150 hover:border-ink motion-reduce:transition-none">
      <span aria-hidden className="flex size-16 items-center justify-center overflow-hidden rounded-[4px] bg-paper">
        <Illustration scene={relationship ? relationshipScenes[relationship] : pairScene} className="w-[3.75rem]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium break-keep text-balance">{compareMessages[locale].invitationHeading}</span>
        <span className="mt-1 block truncate text-xs text-mist">{url.replace(/^https?:\/\//, "")}</span>
      </span>
      <span className="flex items-center gap-1 text-xs text-mist">{t.preview}<ArrowRight size={14} aria-hidden /></span>
    </a>
    <div>
      <button type="button" className="pill min-h-[52px] md:w-auto md:min-w-60" onClick={() => copy(url, t.copied)}>{t.copy}<Copy size={18} weight="light" aria-hidden /></button>
      <p role="status" className="mt-2 text-sm">{status}</p>
    </div>
    {inWeChat && <p className="text-xs text-mist">{m.wechatHint}</p>}
    {manual && <input aria-label={s.manualCopy} readOnly value={url} onFocus={e => e.currentTarget.select()} className="min-h-11 w-full border border-line p-2 text-sm" />}
  </div>;
}
