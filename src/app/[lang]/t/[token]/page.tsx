import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { PreferenceSummary } from "@/components/compare/preference-summary";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { ShareQuizLink, ShareVisit } from "@/components/share/share-visit";
import { PairingExample } from "@/components/pairing/pairing-example";
import { findOwnedComparisonForInvitation, getPublicInvitation, getInvitationState, listComparisonResults } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { appUrl } from "@/lib/env";
type Props = { params: Promise<{ token: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params; const invitation = await getPublicInvitation(token); const locale = invitation?.locale ?? await getLocale(); const m = compareMessages[locale]; const description = pairingMessages[locale].summary + " " + pairingMessages[locale].delayedGeneration;
  if (!invitation) return { title: m.unavailable, robots: { index: false, follow: false }, referrer: "no-referrer", openGraph: null, twitter: null };
  const url = appUrl() + href(locale, `/t/${token}`); const image = appUrl() + href(locale, "/opengraph-image");
  return { title: m.invitationHeading, description, robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: url }, openGraph: { title: m.invitationHeading, description, url, siteName: "mirror", type: "website", locale: locale === "en" ? "en_US" : "zh_CN", images: [{ url: image, width: 1200, height: 630, alt: "mirror" }] }, twitter: { card: "summary_large_image", title: m.invitationHeading, description, images: [image] } };
}
export default async function InvitationPage({ params }: Props) {
  const { token } = await params; const locale = await getLocale(); const visitor = await getVisitorId();
  const existing = visitor ? await findOwnedComparisonForInvitation(token, visitor) : null;
  if (existing) redirect(existing.url);
  const invitation = await getPublicInvitation(token);
  if (!invitation) return <CompareUnavailable locale={locale} legacy={await getInvitationState(token) === "legacy"} />;
  if (locale !== invitation.locale) redirect(href(invitation.locale, `/t/${token}`));
  const m = compareMessages[locale]; const ui = pairingUiMessages[locale]; const p = pairingMessages[locale]; const choices = visitor ? await listComparisonResults(visitor) : [];
  return <><AppHeader variant="page" title={p.title} backHref={href(locale, "/")} /><main data-share-static className="mx-auto max-w-[960px] px-6 py-8 md:py-14"><h1 className="text-[28px] leading-[1.4]">{m.invitationHeading}</h1><ul className="my-6 space-y-2 text-sm">{ui.outputs.map(text => <li key={text}>— {text}</li>)}</ul><div data-share-card><PreferenceSummary snapshot={invitation.snapshot} locale={locale} title={ui.hostScope} /></div><div className="mt-7"><PairingExample locale={locale} compact /></div><section className="mt-7">{choices.length > 0 && <p className="text-sm leading-[1.8]">{p.feeRule}</p>}<p className="mt-3 text-sm leading-[1.8]">{ui.noConsentYet}</p><div className="mt-6 flex flex-wrap items-center gap-4">{choices.length > 0 && <a href={href(locale, `/t/${token}/join`)} className="pill min-h-11">{m.chooseExisting}</a>}<ShareQuizLink token={token} surface="invitation" locale={locale} href={href(locale, `/quiz?compare=${token}`)} className={`${choices.length ? "text-link" : "pill"} inline-flex min-h-11 text-sm`}>{ui.start}</ShareQuizLink>{!choices.length && <a href={href(locale, `/t/${token}/join`)} className="text-link min-h-11 text-sm">{m.chooseExisting}</a>}</div><div className="mt-3 flex flex-wrap gap-4 text-xs"><a className="text-link min-h-11" href={href(locale === "zh" ? "en" : "zh", `/quiz?compare=${token}`)}>{locale === "zh" ? "English" : "中文"}</a><a className="text-link min-h-11" href={href(locale, "/pairing")}>{ui.learn}</a></div><p className="mt-5 text-xs leading-[1.8] text-mist">{m.invitationEnd} <time dateTime={invitation.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(invitation.expiresAt))}</time></p></section><ShareVisit token={token} locale={locale} surface="invitation" /></main></>;
}
