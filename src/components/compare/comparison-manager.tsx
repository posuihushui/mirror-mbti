"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { shareMessages } from "@/lib/i18n/messages/share";
import { CompareRevoke } from "./compare-revoke";

type PairItem = { id: string; url: string; locale: Locale; createdAt: string };
type InvitationItem = PairItem & { expiresAt: string; revokedAt: string | null };
export function ComparisonManager({ items, invitations, locale }: { items: PairItem[]; invitations: InvitationItem[]; locale: Locale }) {
  const m = compareMessages[locale]; const s = shareMessages[locale];
  const [closed, setClosed] = useState<string[]>([]);
  // Closing an invitation removes access to every related pair on the server. Hide the list
  // immediately while its authoritative server render is refreshed, without guessing relations.
  const [refreshing, setRefreshing] = useState(false);
  const [lastItems, setLastItems] = useState(items);
  if (lastItems !== items) { setLastItems(items); setRefreshing(false); }
  return <section className="mt-12 space-y-6 border-t border-line pt-8" data-comparison-manager><h2 className="text-2xl">{m.comparisons}</h2>
    {!items.length && <p className="text-sm text-mist">{m.empty}</p>}
    {!refreshing && items.filter((item) => !closed.includes(item.id)).map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4"><a className="text-link min-h-11" href={item.url}>{m.title} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.createdAt))}</a><CompareRevoke id={item.id} locale={locale} onRevoked={() => setClosed((list) => [...list, item.id])} /></article>)}
    <h2 className="pt-5 text-2xl">{m.invitations}</h2>
    {invitations.map((item) => <article key={item.id} className="space-y-3 border-b border-line py-4"><p className="text-sm">{m.invitationEnd} <time dateTime={item.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.expiresAt))}</time></p>{item.revokedAt || closed.includes(item.id) ? <p className="text-xs">{m.revoked}</p> : <div className="flex flex-wrap items-center gap-5"><a className="text-link min-h-11 text-sm" href={item.url}>{s.preview}</a><CompareRevoke kind="invitation" id={item.id} locale={locale} onRevoked={() => { setClosed((list) => [...list, item.id]); setRefreshing(true); }} /></div>}</article>)}
  </section>;
}
