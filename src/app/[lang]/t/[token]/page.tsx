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
import { siteCopy } from "@/lib/site";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  const locale = invitation?.locale ?? await getLocale();
  const m = compareMessages[locale];
  const description = pairingMessages[locale].summary + " " + pairingMessages[locale].delayedGeneration;
  if (!invitation) return { title: m.unavailable, robots: { index: false, follow: false }, referrer: "no-referrer", openGraph: null, twitter: null };
  const url = appUrl() + href(locale, `/t/${token}`);
  // The invitation's own card, so a forwarded link shows what it is. It carries no host data.
  const image = `${url}/opengraph-image`;
  // Absolute for the same reason as the share card: the invitation carries its own language.
  return {
    title: { absolute: `${m.invitationHeading} · ${siteCopy(locale).name}` }, description,
    robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: url },
    openGraph: { title: m.invitationHeading, description, url, siteName: "mirror", type: "website", locale: locale === "en" ? "en_US" : "zh_CN", images: [{ url: image, width: 1200, height: 630, alt: m.invitationHeading }] },
    twitter: { card: "summary_large_image", title: m.invitationHeading, description, images: [image] },
  };
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const locale = await getLocale();
  const visitor = await getVisitorId();
  const existing = visitor ? await findOwnedComparisonForInvitation(token, visitor) : null;
  if (existing) redirect(existing.url);
  const invitation = await getPublicInvitation(token);
  if (!invitation) return <CompareUnavailable locale={locale} legacy={await getInvitationState(token) === "legacy"} />;
  if (locale !== invitation.locale) redirect(href(invitation.locale, `/t/${token}`));
  const m = compareMessages[locale];
  const ui = pairingUiMessages[locale];
  const p = pairingMessages[locale];
  const choices = visitor ? await listComparisonResults(visitor) : [];
  const hasResults = choices.length > 0;
  const joinHref = href(locale, `/t/${token}/join`);
  const quizHref = href(locale, `/quiz?compare=${token}`);
  const startQuiz = <ShareQuizLink token={token} surface="invitation" locale={locale} href={quizHref} className={hasResults ? "text-link min-h-11 shrink-0 text-sm" : "pill min-h-11 md:w-auto"}>{ui.start}</ShareQuizLink>;
  const useExisting = <a href={joinHref} className={hasResults ? "pill min-h-11 md:w-auto" : "text-link min-h-11 shrink-0 text-sm"}>{m.chooseExisting}</a>;
  return <>
    <AppHeader variant="page" title={p.title} backHref={href(locale, "/")} />
    <main data-share-static className="mx-auto max-w-[1060px] px-6 py-8 md:py-14">
      <div className="grid gap-9 md:grid-cols-2 md:gap-x-14 md:gap-y-10 md:[grid-template-rows:auto_1fr]">
        <section className="md:col-start-1 md:row-start-1">
          <p className="eyebrow text-mist">{ui.introEyebrow}</p>
          <h1 className="mt-5 text-[29px] leading-[1.4] md:text-[38px]">{m.invitationHeading}</h1>
          <p className="mt-5 text-sm leading-[1.9]">{p.summary}</p>
          <ol className="mt-7 border-y border-line">{ui.outputs.map((text, index) => <li key={text} className={`flex gap-4 py-4 ${index ? "border-t border-line" : ""}`}>
            <span aria-hidden="true" className="eyebrow pt-1.5 text-[#8d7259]">{`0${index + 1}`}</span>
            <span className="text-[15px] leading-[1.7]">{text}</span>
          </li>)}</ol>
        </section>
        {/* The preview and the host's agreed scope: the proof, above the decision on a phone. */}
        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          <PairingExample locale={locale} />
          <div data-share-card className="mt-5"><PreferenceSummary snapshot={invitation.snapshot} locale={locale} title={ui.hostScope} /></div>
        </div>
        <section className="md:col-start-1 md:row-start-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">{hasResults ? <>{useExisting}{startQuiz}</> : <>{startQuiz}{useExisting}</>}</div>
          <p className="mt-5 text-xs leading-[1.9] text-mist">{ui.noConsentYet}</p>
          {hasResults && <p className="mt-2 text-xs leading-[1.9] text-mist">{p.feeRule}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 text-xs">
            <a className="text-link min-h-11" href={href(locale === "zh" ? "en" : "zh", `/quiz?compare=${token}`)}>{locale === "zh" ? "English" : "中文"}</a>
            <a className="text-link min-h-11" href={href(locale, "/pairing")}>{ui.learn}</a>
          </div>
          <p className="mt-3 text-xs leading-[1.8] text-mist">{m.invitationEnd} <time dateTime={invitation.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(invitation.expiresAt))}</time></p>
        </section>
      </div>
      <ShareVisit token={token} locale={locale} surface="invitation" />
    </main>
  </>;
}
