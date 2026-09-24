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
type GuideItem = PairItem & { invitationId: string };
type InvitationItem = PairItem & { expiresAt: string; snapshot: CompareSnapshot };

/** Guides first, then the invitations that produce them; an invitation says how many people have joined it. */
export function ComparisonManager({ items, invitations, locale }: { items: GuideItem[]; invitations: InvitationItem[]; locale: Locale }) {
  const m = compareMessages[locale]; const ui = pairingUiMessages[locale];
  const [closed, setClosed] = useState<string[]>([]);
  // Closing an invitation removes access to every related pair on the server. Hide the list
  // immediately while its authoritative server render is refreshed, without guessing relations.
  const [refreshing, setRefreshing] = useState(false);
  const [lastItems, setLastItems] = useState(items);
  if (lastItems !== items) { setLastItems(items); setRefreshing(false); }
  const date = (iso: string) => new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
  const joined = (invitationId: string) => items.filter((item) => item.invitationId === invitationId && !item.revokedAt).length;
  return <section className="mt-10 space-y-10" data-comparison-manager>
    <div>
      <h2 className="text-2xl leading-heading">{m.guidesHeading}</h2>
      {!items.length && <p className="mt-3 text-sm text-mist">{m.empty}</p>}
      <div className="mt-4 border-t border-line">
        {!refreshing && items.filter((item) => !closed.includes(item.id)).map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4">{item.revokedAt ? <p className="text-sm text-mist">{m.revoked}</p> : <><TextLink href={item.url} prefetch={false} className="font-medium">{m.title} · {date(item.createdAt)}</TextLink><CompareRevoke id={item.id} locale={locale} onRevoked={() => setClosed((list) => [...list, item.id])} /></>}</article>)}
      </div>
    </div>
    <div>
      <h2 className="text-2xl leading-heading">{m.invitations}</h2>
      {!invitations.length && <p className="mt-3 text-sm text-mist">{ui.emptyInvitations}</p>}
      <div className="mt-4 space-y-4">
        {invitations.map((item) => {
          const count = joined(item.id);
          const open = !item.revokedAt && !closed.includes(item.id);
          const status = item.accessPolicy === "legacy-free-v1" ? ui.legacy : new Date(item.expiresAt) <= new Date() ? ui.expired : count > 0 ? ui.joined(count) : ui.active;
          return <article key={item.id} className="border border-line bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className={open && count > 0 ? "text-base font-medium text-[#4f6552]" : "text-base font-medium"}>{open ? status : m.revoked}</p>
              <p className="text-xs text-mist">{ui.dates} {date(item.createdAt)} · {m.invitationEnd} <time dateTime={item.expiresAt}>{date(item.expiresAt)}</time></p>
            </div>
            {open && <div className="mt-5 space-y-5">
              <PreferenceSummary snapshot={item.snapshot} locale={locale} title={ui.scope} />
              <InvitationActions url={item.url} locale={locale} />
              <div className="border-t border-line pt-3"><CompareRevoke kind="invitation" id={item.id} locale={locale} onRevoked={() => { setClosed((list) => [...list, item.id]); setRefreshing(true); }} /></div>
            </div>}
          </article>;
        })}
      </div>
    </div>
  </section>;
}
