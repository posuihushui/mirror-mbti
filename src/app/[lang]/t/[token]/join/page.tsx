import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { CompareConsent } from "@/components/compare/compare-consent";
import { getPublicInvitation, getComparisonResult, listComparisonResults } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { appUrl } from "@/lib/env";
type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ result?: string }> };
export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); const title = compareMessages[locale].title; const image = appUrl() + href(locale, "/opengraph-image"); return { title, robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: null, languages: {} }, openGraph: { title: "mirror", images: [image] }, twitter: { title: "mirror", images: [image], card: "summary_large_image" } }; }
export default async function JoinPage({ params, searchParams }: Props) {
  const { token } = await params; const { result } = await searchParams; const locale = await getLocale();
  const invitation = await getPublicInvitation(token);
  if (!invitation) return <CompareUnavailable locale={locale} />;
  if (locale !== invitation.locale) redirect(href(invitation.locale, `/t/${token}/join${result ? `?result=${encodeURIComponent(result)}` : ""}`));
  const visitor = await getVisitorId(); const m = compareMessages[locale];
  const selected = result && visitor ? await getComparisonResult(result, visitor) : null;
  if (result && !selected) return <CompareUnavailable locale={locale} />;
  const choices = !selected && visitor ? await listComparisonResults(visitor) : [];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, `/t/${token}`)} /><main data-share-static className="mx-auto max-w-[680px] px-6 py-8 md:py-14"><h1 className="mb-7 text-[28px] leading-[1.3]">{selected ? m.continue : m.chooseResult}</h1>{selected ? <CompareConsent key={selected.id} kind="guest" invitationToken={token} resultId={selected.id} snapshot={selected.snapshot} locale={locale} /> : <><p className="mb-6 text-sm leading-[1.8]">{m.guestConsentDetail}</p><ul className="space-y-4">{choices.map((item) => <li key={item.id}><a className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-[4px] border border-line p-4 text-sm" href={href(locale, `/t/${token}/join?result=${encodeURIComponent(item.id)}`)}><span>{m.questionnaire} · {item.snapshot.questionnaireId}</span><time dateTime={item.snapshot.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.snapshot.createdAt))}</time></a></li>)}</ul>{!choices.length && <p className="my-5 text-sm">{m.noResults}</p>}<a href={href(locale, `/quiz?compare=${token}`)} className="pill mt-7 inline-flex min-h-11">{m.start}</a></>}</main></>;
}
