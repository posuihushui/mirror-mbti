import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { CompareReveal } from "@/components/compare/compare-reveal";
import { ComparisonVisit } from "@/components/compare/comparison-visit";
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
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/my/shares")} /><main data-share-static className="mx-auto max-w-[960px] px-6 py-8 md:py-14"><h1 className="mb-8 text-[28px] leading-[1.3]">{m.title}</h1><ComparisonReading id={id} locale={locale}><ComparisonVisit pairId={id} /><CompareReveal mode="panels"><div data-compare-motion="host"><PreferenceSummary snapshot={pair.hostSnapshot} locale={locale} title={pair.role === "host" ? m.you : m.other} /></div><span data-compare-motion="dot" aria-hidden="true" className={styles.dot} /><div data-compare-motion="guest"><PreferenceSummary snapshot={pair.guestSnapshot} locale={locale} title={pair.role === "guest" ? m.you : m.other} /></div></CompareReveal>{pair.outputSnapshot.differentQuestionnaires && <p className="mt-6 text-xs leading-[1.8] text-mist">{m.differentQuestionnaires}</p>}<div className="mt-8"><CompareReveal mode="sections">{pair.outputSnapshot.sections.map((section, index) => <section key={index} data-compare-motion="section" className="border-t border-line py-6"><p aria-hidden="true" className="mb-3 text-[10px] tracking-[.14em] text-[#c49473]">0{index + 1}</p><h2 className="text-xl leading-[1.4]">{section.title}</h2><p className="mt-4 text-sm leading-[1.8]">{section.body}</p>{section.practice && <p className="mt-4 border-l border-[#c49473] pl-4 text-sm leading-[1.8]">{section.practice}</p>}</section>)}</CompareReveal></div><p className="mt-6 text-xs leading-[1.8] text-mist">{m.note}</p></ComparisonReading></main></>;
}
