"use client";
import { TextLink } from "@/components/site/text-link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";

export function InvitationActions({ url, locale }: { url: string; locale: Locale }) {
  const [text, setText] = useState(pairingMessages[locale].invitationText(url));
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);
  const m = pairingUiMessages[locale]; const s = shareMessages[locale];
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setStatus(label); setManual(false); }
    catch { setManual(true); setStatus(s.manualCopy); }
  }
  return <div className="space-y-4 print:hidden"><div className="flex flex-wrap items-center gap-4"><TextLink href={url} prefetch={false}>{s.preview}</TextLink><button type="button" className="pill min-h-11" onClick={() => copy(url, s.copied)}>{s.copy}</button></div><label className="block text-xs">{m.invitationText}<textarea value={text} onChange={e => setText(e.target.value)} className="mt-2 min-h-32 w-full border border-line bg-transparent p-3 text-sm" /></label><button type="button" className="text-link min-h-11 text-sm" onClick={() => copy(text, m.copiedText)}>{m.copyText}</button><p role="status" className="text-sm">{status}</p>{manual && <input aria-label={s.manualCopy} readOnly value={url} onFocus={e => e.currentTarget.select()} className="min-h-11 w-full border border-line p-2 text-sm" />}</div>;
}
