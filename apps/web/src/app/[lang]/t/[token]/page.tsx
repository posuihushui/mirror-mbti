import { TextLink } from "@/components/site/text-link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { testedOn } from "@/components/compare/preference-summary";
import { categoryMirrorProfile } from "@/components/brand/mirror-mark";
import { categoryNames, PairLines, PairMarks } from "@/components/pairing/pair-figures";
import { GuideSteps } from "@/components/report/report-invite";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { ShareQuizLink, ShareVisit } from "@/components/share/share-visit";
import { PairingExample } from "@/components/pairing/pairing-example";
import { Illustration } from "@/components/illustrations/scene";
import { pairScene, relationshipScenes } from "@/components/illustrations/moment-scenes";
import { findOwnedComparisonForInvitation, getPublicInvitation, getInvitationState, listComparisonResults } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { appUrl } from "@/lib/env";
import { siteCopy } from "@/lib/site";
import { ArrowRight, ArrowsLeftRight, Briefcase, ChatCircleDots, Heart, Hourglass, HouseLine, LockSimple, Quotes, Smiley, UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { CompareRelationship } from "@/lib/compare-types";

const relationshipGlyphs: Record<CompareRelationship, Icon> = { partner: Heart, friend: Smiley, family: HouseLine, colleague: Briefcase };

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
  // The action the reader most likely wants: their own result if they have one, otherwise the test.
  const pill = "pill min-h-[52px] md:w-auto md:min-w-64";
  const link = "text-link shrink-0";
  const startQuiz = (primary: boolean) => <ShareQuizLink token={token} surface="invitation" locale={locale} href={quizHref} className={primary ? pill : link}>{ui.start}</ShareQuizLink>;
  const useExisting = (primary: boolean) => <a href={joinHref} className={primary ? pill : link}>{m.chooseExisting}<ArrowRight size={primary ? 19 : 15} weight={primary ? "light" : "regular"} aria-hidden className="shrink-0" /></a>;
  const primary = hasResults ? useExisting : startQuiz;
  const secondary = hasResults ? startQuiz : useExisting;
  const l = ui.landing;
  const t = ui.reportInvite;
  const host = invitation.snapshot.categories;
  const PairIcon = invitation.relationship ? relationshipGlyphs[invitation.relationship] : UsersThree;
  const pairItems = [...l.pairItems, invitation.relationship ? l.pairRelationship(m.relationshipLabels[invitation.relationship]) : l.pairAny];
  const pairIcons = [ChatCircleDots, ArrowsLeftRight, Quotes, PairIcon];
  return <>
    <AppHeader variant="page" title={p.title} backHref={href(locale, "/")} />
    <main data-share-static className="mx-auto max-w-[1060px] px-6 pt-8 pb-[120px] md:py-14">
      <div className="grid gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-x-14">
        {/* The invitation and what taking it up involves, drawn as three stops; the decision follows directly. */}
        <section className="min-w-0 md:sticky md:top-24 md:self-start">
          {/* The relationship's own scene (a shared moment, never faces); like the eyebrow, it stays off the metadata and OG card. */}
          <Illustration scene={invitation.relationship ? relationshipScenes[invitation.relationship] : pairScene} className="mb-6 w-full max-w-56" />
          {/* The relationship the host chose names the invitation; the metadata and OG card never carry it. */}
          <p className="eyebrow text-mist">{invitation.relationship ? m.relationshipBetween[invitation.relationship] : ui.introEyebrow}</p>
          {invitation.hostNote && <figure className="warm-panel mt-5 p-5">
            <blockquote className="text-lg">{invitation.hostNote}</blockquote>
            <figcaption className="mt-2 text-xs text-mist">{m.hostNoteFrom}</figcaption>
          </figure>}
          <h1 className="mt-5 text-3xl md:text-4xl">{m.invitationHeading}</h1>
          <p className="mt-4 text-base text-slate">{l.lead}</p>
          {/* Before the test: no price and no purchase words, only that the report is taken care of. */}
          {invitation.covered && <p data-gift="banner" className="mt-5 border-l-2 border-warm pl-4 text-base">{ui.gift.banner}</p>}
          <div className="mt-8" data-invitation-steps><GuideSteps steps={l.steps} reached={0} locale={locale} kind="invitee" /></div>
          <div className="mt-8 flex flex-col gap-2 md:flex-row md:items-center md:gap-6"><span className="hidden md:contents">{primary(true)}</span>{secondary(false)}</div>
          <p className="mt-4 text-xs text-mist">{l.consent}</p>
          {hasResults && !invitation.covered && <p className="mt-2 text-xs text-mist">{p.feeRule}</p>}
          <div className="mt-3 flex flex-wrap gap-x-6 text-xs">
            <TextLink href={href(locale === "zh" ? "en" : "zh", `/quiz?compare=${token}`)} prefetch={false} hrefLang={locale === "zh" ? "en" : "zh-CN"}>{locale === "zh" ? "English" : "中文"}</TextLink>
            <TextLink href={href(locale, "/pairing")}>{ui.learn}</TextLink>
          </div>
          <p className="mt-3 text-xs text-mist">{m.invitationEnd} <time dateTime={invitation.expiresAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(invitation.expiresAt))}</time></p>
        </section>
        <div className="min-w-0 space-y-14">
          {/* Part one, the host's side: exactly what they agreed to publish, placed on the guide's lines, with the reader's row left open. */}
          <section data-share-card data-invitation-part="side" aria-labelledby="invitation-side">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="invitation-side" className="text-2xl">{l.sideTitle}</h2>
              <p className="flex items-center gap-1.5 text-xs text-mist"><LockSimple size={14} aria-hidden />{l.sideTag}</p>
            </div>
            <div className="mt-4 rounded-[4px] border border-line bg-card p-5 md:p-6">
              <PairMarks you={categoryMirrorProfile([host.EI, host.SN, host.TF, host.JP])} partner={null} labels={[t.them, t.you]} size={44} />
              <div className="mt-6"><PairLines locale={locale} you={null} them={host} first="them" sr={l.sideSr(categoryNames(locale, host))} caption={l.sideCaption} /></div>
              <p className="mt-5 border-t border-line pt-3 text-xs text-mist">{testedOn(invitation.snapshot, locale)}</p>
            </div>
          </section>
          {/* Part two, the two of them: what the guide holds, then a fictional example. Nothing of it exists until the reader answers. */}
          <section data-invitation-part="pair" aria-labelledby="invitation-pair">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="invitation-pair" className="text-2xl">{l.pairTitle}</h2>
              <p className="flex items-center gap-1.5 text-xs text-mist"><Hourglass size={14} aria-hidden />{l.pairTag}</p>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2">{pairItems.map((item, index) => {
              const Glyph = pairIcons[index];
              return <li key={item} className="flex flex-col gap-3 rounded-[4px] border border-line bg-card p-4">
                <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-warm/15 text-warm-ink"><Glyph size={18} weight="light" /></span>
                <span className="text-sm">{item}</span>
              </li>;
            })}</ul>
            <div className="mt-8"><PairingExample locale={locale} relationship={invitation.relationship} /></div>
          </section>
        </div>
      </div>
      <Dock>{primary(true)}</Dock>
      <ShareVisit token={token} locale={locale} surface="invitation" />
    </main>
  </>;
}
