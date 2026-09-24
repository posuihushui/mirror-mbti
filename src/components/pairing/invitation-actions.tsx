"use client";
import { Copy } from "@phosphor-icons/react";
import { TextLink } from "@/components/site/text-link";
import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";
import { isWeChat } from "@/lib/ua";

const noopSubscribe = () => () => {};

/**
 * Sending an invitation. In a chat app people paste a message, so copying the (editable) invitation
 * text with its link is the main action; the bare link and a preview come second. Inside WeChat a
 * hint also points at the ··· menu, which shares the invitation page itself once it is open.
 */
export function InvitationActions({ url, locale }: { url: string; locale: Locale }) {
  const [text, setText] = useState(pairingMessages[locale].invitationText(url));
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);
  const inWeChat = useSyncExternalStore(noopSubscribe, () => isWeChat(navigator.userAgent), () => false);
  const m = pairingUiMessages[locale]; const s = shareMessages[locale];
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setStatus(label); setManual(false); }
    catch { setManual(true); setStatus(s.manualCopy); }
  }
  return <div className="space-y-4 print:hidden">
    <label className="block text-xs text-mist">{m.invitationText}<textarea value={text} onChange={e => setText(e.target.value)} className="mt-2 min-h-32 w-full border border-line bg-transparent p-3 text-sm text-ink" /></label>
    <button type="button" className="pill min-h-[52px] md:w-auto md:min-w-60" onClick={() => copy(text, m.copiedText)}>{m.copyText}<Copy size={18} weight="light" aria-hidden /></button>
    <div className="flex flex-wrap items-center gap-x-6">
      <button type="button" className="text-link" onClick={() => copy(url, s.copied)}>{s.copy}<Copy size={15} aria-hidden /></button>
      <TextLink href={url} prefetch={false}>{s.preview}</TextLink>
    </div>
    {inWeChat && <p className="text-xs text-mist">{m.wechatHint}</p>}
    <p role="status" className="text-sm">{status}</p>
    {manual && <input aria-label={s.manualCopy} readOnly value={url} onFocus={e => e.currentTarget.select()} className="min-h-11 w-full border border-line p-2 text-sm" />}
  </div>;
}
