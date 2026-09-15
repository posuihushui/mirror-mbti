import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { PreferenceSummary } from "@/components/compare/preference-summary";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { ShareQuizLink, ShareVisit } from "@/components/share/share-visit";
import { getPublicInvitation } from "@/lib/comparisons";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { appUrl } from "@/lib/env";

type Props = { params: Promise<{ token: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  const locale = invitation?.locale ?? await getLocale(); const m = compareMessages[locale];
  if (!invitation) return { title: m.unavailable, robots: { index: false, follow: false }, referrer: "no-referrer", openGraph: null, twitter: null };
  const url = appUrl() + href(locale, `/t/${token}`);
  const image = appUrl() + href(locale, "/opengraph-image");
  return { title: m.invitationHeading, description: m.note, robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: url }, openGraph: { title: m.invitationHeading, description: m.note, url, siteName: "mirror", type: "website", locale: locale === "en" ? "en_US" : "zh_CN", images: [{ url: image, width: 1200, height: 630, alt: "mirror" }] }, twitter: { card: "summary_large_image", title: m.invitationHeading, description: m.note, images: [image] } };
}
export default async function InvitationPage({ params }: Props) {
  const { token } = await params; const locale = await getLocale();
  const invitation = await getPublicInvitation(token);
  if (!invitation) return <CompareUnavailable locale={locale} />;
  if (locale !== invitation.locale) redirect(href(invitation.locale, `/t/${token}`));
  const m = compareMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/")} /><main data-share-static className="mx-auto max-w-[960px] px-6 py-8 md:py-14"><h1 className="mb-8 text-[28px] leading-[1.25]">{m.invitationHeading}</h1><div className="grid gap-8 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"><div data-share-card><PreferenceSummary snapshot={invitation.snapshot} locale={locale} title={m.host} /></div><section><p className="text-sm leading-[1.8]">{m.note}</p><ShareQuizLink token={token} surface="invitation" locale={locale} href={href(locale, `/quiz?compare=${token}`)} className="pill mt-6 flex min-h-11">{m.start}</ShareQuizLink><a href={href(locale, `/t/${token}/join`)} className="text-link mt-4 inline-flex min-h-11 text-sm">{m.chooseExisting}</a><p className="mt-5 text-xs leading-[1.8] text-mist">{m.invitationEnd} <time dateTime={invitation.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(invitation.expiresAt))}</time></p></section></div><ShareVisit token={token} locale={locale} surface="invitation" /></main></>;
}
