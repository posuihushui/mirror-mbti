import { getPublicInvitation } from "@/lib/comparisons";
import { PairingBenefit } from "@/components/pairing/pairing-benefit";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import { ContinuationAction } from "@/components/pairing/continuation-action";
import { ContinuationList } from "@/components/pairing/continuation-list";
import { AccessActions } from "@/components/pairing/access-actions";
import { listComparisonContinuations } from "@/lib/comparison-continuations";
import { getPairingEligibility } from "@/lib/pairing-eligibility";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { ShareEntry } from "@/components/share/share-entry";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ResultActions } from "@/components/result/result-actions";
import { ResultChart } from "@/components/result/result-chart";
import { SampleCta } from "@/components/result/sample-cta";
import { TypeIntro } from "@/components/result/type-intro";
import { UnlockPanel } from "@/components/result/unlock-panel";
import { ReportChapters, type ChapterAction } from "@/components/result/report-chapters";
import { ResultNav } from "@/components/result/result-nav";
import { PreferenceReading } from "@/components/result/preference-reading";
import { ReviewAnswers } from "@/components/result/review-answers";
import { RecoverReports } from "@/components/report/recover-reports";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TrackView } from "@/components/analytics/track-view";
import { currencyFor, reportCommerce } from "@/lib/analytics/commerce";
import { trackAttrs } from "@/lib/analytics/events";
import { paymentModeFor, priceLabelFor, priceMinorFor } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { profileMeta, typeMeta } from "@/lib/personality";
import { reportOutline } from "@/lib/report-content";
import { questionnaireLocale, questionnaireName } from "@/lib/questionnaires";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { cryptoNetworks } from "@/lib/payments/crypto/config";
import { pageMetadata } from "@/lib/seo";
import { getVisitorId } from "@/lib/session";
import { siteCopy } from "@/lib/site";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ compare?: string }> };

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = pageMessages[locale].result;
  if (id === SAMPLE_RESULT_ID) {
    const { name, line } = typeMeta("INFJ", locale);
    return pageMetadata({
      locale,
      title: t.sampleMetaTitle(name),
      description: t.sampleMetaDescription(line.replace("\n", locale === "en" ? " " : "")),
      path: "/result/sample",
      shareTitle: t.sampleShareTitle(name),
      shareDescription: t.sampleShareDescription,
      image: "/result/sample/opengraph-image",
    });
  }
  return { title: t.ownTitle, robots: { index: false, follow: false } };
}

export default async function ResultPage({ params, searchParams }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = pageMessages[locale].result;
  const visitorId = id === SAMPLE_RESULT_ID ? null : await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) notFound();
  // A real result is read in the language it was taken in; the sample exists in every locale.
  const resultLocale = questionnaireLocale(result.questionnaireId);
  const query = !result.sample && result.owner ? await searchParams : {};
  const compare = typeof query.compare === "string" && /^[A-Za-z0-9_-]{32}$/.test(query.compare) ? query.compare : null;
  if (!result.sample && resultLocale !== locale) redirect(href(resultLocale, `/result/${id}${compare ? `?compare=${compare}` : ""}`));
  const invitation = compare ? await getPublicInvitation(compare).catch(() => null) : null;
  const eligibility = result.owner && visitorId ? await getPairingEligibility(id, visitorId) : null;
  const continuations = result.owner && visitorId ? await listComparisonContinuations(visitorId, id) : [];
  const ui = pairingUiMessages[locale];
  const { profile, sample } = result;
  const { name } = profileMeta(profile, locale);
  const even = profile.balanced.every(Boolean);
  const price = priceLabelFor(locale);
  const mode = paymentModeFor(locale);
  const secureNote = mode === "mock" ? t.secureMock : mode === "waffo" ? t.secureCard : t.secureLive;

  // A real, owned, still-locked result: the one the page offers its report to.
  const offer = !sample && result.owner && !result.unlocked && eligibility !== "syncing";
  // 请 TA: an invitation this reader came from (or saved) covers their report; joining opens it.
  const coveredToken = offer && eligibility === "locked" ? (invitation?.covered ? compare : null) ?? continuations.find((item) => item.covered)?.invitationToken ?? null : null;
  const covered = coveredToken ? { href: href(locale, `/t/${coveredToken}/join?result=${id}`), buyHref: href(locale, `/result/${id}?compare=${coveredToken}&unlock=1`) } : undefined;

  const actionProps = {
    resultId: result.id,
    type: profile.type,
    name,
    priceLabel: price,
    mode,
    networks: mode === "crypto" ? cryptoNetworks() : [],
    owner: result.owner,
    unlocked: result.owner && result.unlocked,
    syncing: eligibility === "syncing",
    covered: covered?.href,
  } as const;

  // The report's chapters, masked until the report is unlocked, under a sticky nav (16personalities-style).
  // The sample shows them the same way, still masked (owner request, 2026-09-26): its key is the test.
  const r = resultMessages[locale];
  const readable = !sample && result.owner && result.unlocked;
  const outline = reportOutline(profile, locale);
  const chapterAction: ChapterAction | undefined = sample ? { href: href(locale, "/quiz"), label: r.actions.startMine, cta: "start_quiz" }
    : eligibility === "syncing" ? undefined
    : covered ? { href: covered.href, label: ui.gift.accept, cta: "accept_covered" }
    : result.owner ? { href: href(locale, `/result/${id}?${compare ? `compare=${compare}&` : ""}unlock=1`), label: r.chapters.unlock, cta: "unlock_report", replace: true }
    : { href: href(locale, "/quiz"), label: r.actions.startMine, cta: "start_quiz" };
  const navItems = [
    { id: "type", label: r.nav.type, locked: false },
    { id: "dimensions", label: r.nav.dimensions, locked: false },
    ...outline.map((_, i) => ({ id: `chapter-${i + 1}`, label: r.nav.chapters[i], locked: !readable })),
  ];

  const productJsonLd = sample
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: t.productName,
        description: t.productDescription,
        brand: { "@type": "Brand", name: siteCopy(locale).name },
        // No `offers`: the sample is free to read and nothing on the page is for sale.
      }
    : null;

  return (
    <>
      <AppHeader variant="page" title={sample ? t.sampleHeader : t.ownTitle} backHref={href(locale, "/")} path={sample ? "/result/sample" : undefined} />
      <main className="pb-[110px] md:mx-auto md:max-w-6xl md:px-10 md:pb-0">
        <p className="mx-6 my-5 text-xs text-mist md:mx-0 md:my-6">{t.versionLine(questionnaireName(result.questionnaireId, locale) ?? t.legacyVersion, result.questionCount, sample)}</p>
        <section id="type" className="grid scroll-mt-16 gap-4 md:scroll-mt-20 md:grid-cols-2 md:items-stretch md:gap-6 md:pb-6">
          <TypeIntro profile={profile} sample={sample} />
          <ResultChart profile={profile} />
        </section>
        {/* Desktop has no dock, so the report rides at the nav's right end, in reach at every scroll depth. The sample offers the test there. */}
        <ResultNav label={r.nav.label} lockedLabel={sample ? r.nav.sampleLocked : r.nav.locked} items={navItems}>
          {sample ? (
            <PrimaryButton href={href(locale, "/quiz")} className="min-h-11 w-auto gap-3 px-5 text-sm" {...trackAttrs("start_quiz", "result_nav")}>{t.start}</PrimaryButton>
          ) : (
            <Suspense fallback={null}>
              <ResultActions {...actionProps} slot="nav" />
            </Suspense>
          )}
        </ResultNav>
        {!sample && result.owner && result.uniform && (
          <section className="mx-[27px] mb-7 border border-line px-5 py-6 md:mx-0">
            <p className="mb-4 text-sm">{t.uniformNotice}</p>
            <ReviewAnswers resultId={id} />
          </section>
        )}
        <div id="dimensions" className="scroll-mt-16 md:scroll-mt-20"><PreferenceReading profile={profile} /></div>
        {!sample && result.owner && <>
          <ContinuationList items={continuations} locale={locale} />
          {/* When the invitation covers this report, the panel's accept action already continues it. */}
          {compare && !covered && !continuations.some(item => item.invitationToken === compare) && <section className="mx-6 my-7 border-t border-line pt-5 md:mx-0"><h2 className="text-xl">{ui.continue}</h2><p className="my-4 text-sm">{invitation ? ui.continuationNote : ui.continuationExpired}</p>{invitation && <ContinuationAction invitationToken={compare} resultId={id} resultLocale={locale} locale={locale} />}</section>}
          {eligibility === "syncing" && <section className="mx-6 md:mx-0"><AccessActions resultId={id} locale={locale} surface="result" /></section>}
        </>}
        <ReportChapters outline={outline} readHref={readable ? href(locale, `/report/${id}`) : undefined} action={chapterAction} sample={sample} />
        {/* The report is the offer; the guide for two comes with it, so it follows rather than leads. */}
        {sample ? (
          /* Nothing on the sample is for sale: it closes by inviting the test, not by quoting a price. */
          <SampleCta />
        ) : result.owner && result.unlocked ? <div className="mx-6 mb-8 md:mx-0"><PrimaryButton href={href(locale, `/report/${id}`)} className="md:max-w-xs">{t.readPurchased}</PrimaryButton></div> : eligibility === "syncing" ? null : (
          <UnlockPanel
            covered={covered}
            priceLabel={price}
            secureNote={secureNote}
            action={
              <Suspense fallback={null}>
                <ResultActions {...actionProps} slot="panel" />
              </Suspense>
            }
          />
        )}
        {!sample && result.owner && eligibility !== "syncing" && <PairingTracker resultId={id} surface="result"><PairingBenefit locale={locale} resultId={id} unlocked={result.unlocked} /></PairingTracker>}
        {!sample && result.owner && <ShareEntry resultId={id} locale={locale} />}
        {/* A buyer who reopened this page inside a wallet app has no visitor cookie; the order number restores it. */}
        {!sample && !result.owner && mode === "crypto" && (
          <section className="mx-[27px] mb-8 max-w-[560px] border-t border-line pt-6 md:mx-0" aria-labelledby="wallet-handoff">
            <h2 id="wallet-handoff" className="text-xl leading-heading">{t.handoffHeading}</h2>
            <p className="mt-3 mb-5 text-sm text-mist">{t.handoffBody}</p>
            <RecoverReports returnTo={href(locale, `/result/${id}?unlock=1`)} />
          </section>
        )}
        <p className="mx-6 my-8 text-center text-xs text-mist md:mx-0 md:mb-10">
          {t.closing}
        </p>
      </main>
      {sample ? (
        <Dock>
          <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
        </Dock>
      ) : (
        <Suspense fallback={null}>
          <ResultActions {...actionProps} slot="dock" />
        </Suspense>
      )}
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <TrackView event="result_view" params={{ questionnaire_id: result.questionnaireId, question_count: result.questionCount, is_sample: sample, result_owner: result.owner, result_even: even, result_uniform: result.uniform, result_unlocked: result.owner && result.unlocked }} />
      {!sample && result.owner && !result.unlocked && <TrackView event="view_item" params={reportCommerce(currencyFor(locale), priceMinorFor(locale))} />}
    </>
  );
}
