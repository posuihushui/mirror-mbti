import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { InvitationEntry } from "@/components/compare/invitation-entry";
import { ComparisonManager } from "@/components/compare/comparison-manager";
import { ContinuationList } from "@/components/pairing/continuation-list";
import { AccessActions } from "@/components/pairing/access-actions";
import { listOwnedComparisons, listComparisonResults } from "@/lib/comparisons";
import { listComparisonContinuations } from "@/lib/comparison-continuations";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { questionnaireName } from "@/lib/questionnaires";
export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { title: pairingUiMessages[locale].center, robots: { index: false, follow: false }, referrer: "no-referrer" }; }
export default async function PairingCenter({ searchParams }: { searchParams: Promise<{ result?: string; share?: string }> }) {
  const locale = await getLocale(); const m = pairingUiMessages[locale]; const visitor = await getVisitorId(); const query = await searchParams;
  const [results, comparisons, continuations] = visitor ? await Promise.all([listComparisonResults(visitor), listOwnedComparisons(visitor), listComparisonContinuations(visitor)]) : [[], { items: [], invitations: [] }, []];
  const selected = typeof query.result === "string" && /^[A-Za-z0-9_-]{12}$/.test(query.result) ? query.result : null;
  const shareId = typeof query.share === "string" && /^[0-9a-f-]{36}$/.test(query.share) ? query.share : undefined;
  const sorted = [...results].sort((a, b) => Number(b.id === selected) - Number(a.id === selected));
  return <><AppHeader variant="page" title={m.center} backHref={href(locale, "/my/report")} path="/my/pairing" /><main data-share-static className="mx-auto max-w-[1000px] px-6 py-8 md:px-10 md:py-14"><h1 className="text-[28px] leading-[1.4]">{m.center}</h1><p className="mt-4 text-sm leading-[1.8] text-mist">{m.waiting}</p><a href={href(locale, "/my/pairing")} className="text-link mt-3 min-h-11 text-sm">{m.refresh}</a><ContinuationList items={continuations} locale={locale} surface="my_pairing" /><section className="mt-8"><h2 className="text-xl">{m.fromResult}</h2><ul className="mt-5 space-y-5">{sorted.map(item => <li key={item.id} data-selected-result={item.id === selected ? "true" : undefined} className="border border-line p-5 md:p-7"><div className="flex flex-wrap justify-between gap-4 text-sm"><span>{questionnaireName(item.snapshot.questionnaireId, locale)}</span><time dateTime={item.snapshot.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.snapshot.createdAt))}</time></div><p className="mt-3 text-sm">{item.eligibility === "eligible" ? m.unlocked : item.eligibility === "syncing" ? m.syncing : m.locked}</p><div className="mt-3 flex flex-wrap items-center gap-5">{item.eligibility === "eligible" ? <InvitationEntry resultId={item.id} shareId={item.id === selected ? shareId : undefined} locale={locale} /> : item.eligibility === "syncing" ? <AccessActions resultId={item.id} locale={locale} surface="result" /> : <a href={href(item.locale, `/result/${item.id}`)} className="text-link min-h-11 text-sm">{m.learnBenefit}</a>}<a href={href(item.locale, `/result/${item.id}`)} className="text-link min-h-11 text-sm">{m.readResult}</a></div></li>)}</ul>{!results.length && <div className="mt-5"><p className="text-sm leading-[1.8]">{m.emptyInvitations}</p><a href={href(locale, "/my/report")} className="text-link mt-4 min-h-11 text-sm">{m.myReports}</a></div>}</section><ComparisonManager {...comparisons} locale={locale} /><noscript><p className="mt-5 text-xs leading-[1.8]">{m.noJs}</p></noscript></main></>;
}
