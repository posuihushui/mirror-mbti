import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { TextLink } from "@/components/site/text-link";
import { categoryMirrorProfile, MirrorMark } from "@/components/brand/mirror-mark";
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
  const date = (iso: string) => new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
  return <><AppHeader variant="page" title={m.center} backHref={href(locale, "/my/report")} path="/my/pairing" /><main data-share-static className="mx-auto max-w-[1000px] px-6 py-8 md:px-10 md:py-14">
    <h1 className="text-3xl leading-heading md:text-4xl">{m.center}</h1>
    <p className="mt-3 max-w-2xl text-base text-slate">{m.centerIntro}</p>
    <a href={href(locale, "/my/pairing")} className="text-link mt-2 text-mist hover:text-ink"><ArrowClockwise size={15} aria-hidden />{m.refresh}</a>
    <ContinuationList items={continuations} locale={locale} surface="my_pairing" />
    {/* What already exists comes first: guides, then open invitations, then starting another. */}
    <ComparisonManager {...comparisons} locale={locale} />
    <section className="mt-14 border-t border-line pt-8">
      <h2 className="text-2xl leading-heading">{m.newInvitation}</h2>
      <p className="mt-2 text-sm text-mist">{m.fromResult}</p>
      <ul className="mt-6 space-y-4">{sorted.map(item => {
        const profile = categoryMirrorProfile([item.snapshot.categories.EI, item.snapshot.categories.SN, item.snapshot.categories.TF, item.snapshot.categories.JP]);
        return <li key={item.id} data-selected-result={item.id === selected ? "true" : undefined} className="border border-line bg-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-3xl leading-none font-medium tracking-tighter">{item.type}</p>
              <p className="mt-2 text-xs text-mist">{questionnaireName(item.snapshot.questionnaireId, locale)} · <time dateTime={item.snapshot.createdAt}>{date(item.snapshot.createdAt)}</time></p>
            </div>
            <MirrorMark profile={profile} size={48} className="shrink-0" />
          </div>
          <p className={item.eligibility === "eligible" ? "mt-4 text-sm text-[#4f6552]" : "mt-4 text-sm text-mist"}>{item.eligibility === "eligible" ? m.unlocked : item.eligibility === "syncing" ? m.syncing : m.locked}</p>
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-8">{item.eligibility === "eligible" ? <InvitationEntry resultId={item.id} shareId={item.id === selected ? shareId : undefined} locale={locale} /> : item.eligibility === "syncing" ? <AccessActions resultId={item.id} locale={locale} surface="result" /> : <TextLink href={href(item.locale, `/result/${item.id}`)} prefetch={false}>{m.learnBenefit}</TextLink>}<TextLink href={href(item.locale, `/result/${item.id}`)} prefetch={false}>{m.readResult}</TextLink></div>
        </li>;
      })}</ul>
      {!results.length && <div className="mt-5"><p className="text-sm">{m.emptyInvitations}</p><TextLink href={href(locale, "/my/report")} prefetch={false} className="mt-3">{m.myReports}</TextLink></div>}
    </section>
    <noscript><p className="mt-5 text-xs">{m.noJs}</p></noscript>
  </main></>;
}
