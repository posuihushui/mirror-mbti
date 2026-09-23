"use client";
import { TextLink } from "@/components/site/text-link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { InvitationActions } from "@/components/pairing/invitation-actions";
import { PreferenceSummary } from "./preference-summary";
import type { CompareSnapshot } from "@/lib/compare-types";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { CompareRevoke } from "./compare-revoke";

type PairItem = { id: string; url: string; locale: Locale; createdAt: string; revokedAt: string | null; accessPolicy: "legacy-free-v1" | "paid-pair-v2" };
type InvitationItem = PairItem & { expiresAt: string; snapshot: CompareSnapshot };
export function ComparisonManager({ items, invitations, locale }: { items: PairItem[]; invitations: InvitationItem[]; locale: Locale }) {
  const m = compareMessages[locale]; const ui = pairingUiMessages[locale];
  const [closed, setClosed] = useState<string[]>([]);
  // Closing an invitation removes access to every related pair on the server. Hide the list
  // immediately while its authoritative server render is refreshed, without guessing relations.
  const [refreshing, setRefreshing] = useState(false);
  const [lastItems, setLastItems] = useState(items);
  if (lastItems !== items) { setLastItems(items); setRefreshing(false); }
  return <section className="mt-12 space-y-6 border-t border-line pt-8" data-comparison-manager><h2 className="text-2xl">{m.comparisons}</h2>
    {!items.length && <p className="text-sm text-mist">{m.empty}</p>}
    {!refreshing && items.filter((item) => !closed.includes(item.id)).map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4">{item.revokedAt ? <p className="text-sm">{m.revoked}</p> : <><TextLink href={item.url} prefetch={false}>{m.title} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.createdAt))}</TextLink><CompareRevoke id={item.id} locale={locale} onRevoked={() => setClosed((list) => [...list, item.id])} /></>}</article>)}
    <h2 className="pt-5 text-2xl">{m.invitations}</h2>{!invitations.length && <p className="text-sm text-mist">{ui.emptyInvitations}</p>}
    {invitations.map((item) => <article key={item.id} className="space-y-3 border-b border-line py-4"><p className="text-xs">{ui.dates} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.createdAt))}</p><p className="text-sm">{m.invitationEnd} <time dateTime={item.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.expiresAt))}</time></p>{item.revokedAt || closed.includes(item.id) ? <p className="text-xs">{m.revoked}</p> : <div className="flex flex-wrap items-center gap-5"><div className="w-full"><p className="mb-4 text-sm">{item.accessPolicy === "legacy-free-v1" ? ui.legacy : new Date(item.expiresAt) <= new Date() ? ui.expired : ui.active}</p><PreferenceSummary snapshot={item.snapshot} locale={locale} title={ui.scope} /><div className="mt-4"><InvitationActions url={item.url} locale={locale} /></div></div><CompareRevoke kind="invitation" id={item.id} locale={locale} onRevoked={() => { setClosed((list) => [...list, item.id]); setRefreshing(true); }} /></div>}</article>)}
  </section>;
}
