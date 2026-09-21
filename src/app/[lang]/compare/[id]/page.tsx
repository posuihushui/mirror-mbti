import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { CompareReveal } from "@/components/compare/compare-reveal";
import { ComparisonVisit } from "@/components/compare/comparison-visit";
import { ComparisonReadingActions } from "@/components/compare/comparison-reading-actions";
import { ComparisonReading } from "@/components/compare/comparison-reading";
import { PreferenceSummary } from "@/components/compare/preference-summary";
import styles from "@/components/compare/compare-motion.module.css";
import { getOwnedComparison } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { appUrl } from "@/lib/env";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); const title = compareMessages[locale].title; const image = appUrl() + href(locale, "/opengraph-image"); return { title, robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: null, languages: {} }, openGraph: { title: "mirror", images: [image] }, twitter: { title: "mirror", images: [image], card: "summary_large_image" } }; }
export default async function ComparisonPage({ params }: Props) {
  const { id } = await params; const locale = await getLocale(); const visitor = await getVisitorId();
  const pair = visitor ? await getOwnedComparison(id, visitor) : null;
  if (!pair) return <CompareUnavailable locale={locale} />;
  if (locale !== pair.locale) redirect(href(pair.locale, `/compare/${id}`));
  const m = compareMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/my/pairing")} /><main data-share-static className="mx-auto max-w-[960px] px-6 py-8 md:py-14"><h1 className="mb-8 text-[28px] leading-[1.3]">{m.title}</h1><ComparisonReadingActions id={id} locale={locale}><ComparisonVisit pairId={id} /><ComparisonReading content={pair.outputSnapshot} locale={locale} sides={{ you: (pair.role === "host" ? pair.hostSnapshot : pair.guestSnapshot).categories, other: (pair.role === "host" ? pair.guestSnapshot : pair.hostSnapshot).categories, youLabel: m.you, otherLabel: m.other }} /><section className="mt-10 border-t border-line pt-7"><div className="flex flex-col gap-4 md:flex-row md:items-center"><a href={href(locale, "/my/pairing")} className="pill min-h-11 md:w-auto">{m.inviteAnother}</a><a href={href(locale, `/compare/${id}/image`)} className="text-link min-h-11 shrink-0 text-sm">{m.saveImage}</a></div><p className="mt-4 text-xs leading-[1.9] text-mist">{m.saveImageNote}</p></section><section className="mt-9 border-t border-line pt-7"><h2 className="eyebrow text-mist">{m.sharedScope}</h2><div className="mt-4"><CompareReveal mode="panels"><div data-compare-motion="host"><PreferenceSummary snapshot={pair.hostSnapshot} locale={locale} title={pair.role === "host" ? m.you : m.other} /></div><span data-compare-motion="dot" aria-hidden="true" className={styles.dot} /><div data-compare-motion="guest"><PreferenceSummary snapshot={pair.guestSnapshot} locale={locale} title={pair.role === "guest" ? m.you : m.other} /></div></CompareReveal></div></section></ComparisonReadingActions></main></>;
}
