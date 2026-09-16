import { getPublicInvitation } from "@/lib/comparisons";
import { compareMessages } from "@/lib/i18n/messages/compare";
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
import { PreferenceReading } from "@/components/result/preference-reading";
import { ReviewAnswers } from "@/components/result/review-answers";
import { RecoverReports } from "@/components/report/recover-reports";
import Link from "next/link";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TrackView } from "@/components/analytics/track-view";
import { currencyFor, reportCommerce } from "@/lib/analytics/commerce";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl, paymentModeFor, priceLabelFor, priceMinorFor } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { hasClearPreference, profileMeta, typeMeta } from "@/lib/personality";
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
  if (!result.sample && resultLocale !== locale) redirect(href(resultLocale, `/result/${id}`));

  const query = !result.sample && result.owner ? await searchParams : {};
  const compare = typeof query.compare === "string" && /^[A-Za-z0-9_-]{32}$/.test(query.compare) ? query.compare : null;
  const invitation = compare ? await getPublicInvitation(compare).catch(() => null) : null;
  const { profile, sample } = result;
  const { name } = profileMeta(profile, locale);
  const clear = hasClearPreference(profile);
  const price = priceLabelFor(locale);
  const mode = paymentModeFor(locale);
  const secureNote = mode === "mock" ? t.secureMock : t.secureLive;

  const actionProps = {
    resultId: result.id,
    type: profile.type,
    name,
    priceLabel: price,
    mode,
    networks: mode === "crypto" ? cryptoNetworks() : [],
    owner: result.owner,
    unlocked: result.owner && result.unlocked,
    clear,
  } as const;

  const productJsonLd = sample
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: t.productName,
        description: t.productDescription,
        brand: { "@type": "Brand", name: siteCopy(locale).name },
        offers: {
          "@type": "Offer",
          price: price,
          priceCurrency: t.currencyCode,
          availability: "https://schema.org/InStock",
          url: `${appUrl()}${href(locale, "/result/sample")}`,
        },
      }
    : null;

  return (
    <>
      <AppHeader variant="page" title={sample ? t.sampleHeader : t.ownTitle} backHref={href(locale, "/")} path={sample ? "/result/sample" : undefined} />
      <main className="pt-[15px] pb-[110px] md:mx-auto md:max-w-[1150px] md:px-10 md:pt-0 md:pb-0">
        <p className="mx-[27px] mt-5 text-[12px] text-mist md:mx-0">{t.versionLine(questionnaireName(result.questionnaireId, locale) ?? t.legacyVersion, result.questionCount, sample)}</p>
        <section className="block md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-[58px] md:pb-[50px] xl:gap-20">
          <TypeIntro profile={profile} sample={sample} />
          <ResultChart profile={profile} />
        </section>
        <PreferenceReading profile={profile} />
        {!sample && result.owner && <ShareEntry resultId={id} locale={locale} />}
        {!sample && result.owner && compare && invitation && <section className="mx-[27px] mb-8 border-t border-line pt-6 md:mx-0"><h2 className="text-[22px]">{compareMessages[locale].title}</h2><p className="mt-3 text-[12px] leading-[2] text-mist">{compareMessages[locale].guestConsentDetail}</p><Link prefetch={false} href={href(invitation.locale,`/t/${compare}/join?result=${id}`)} className="pill mt-5 inline-flex">{compareMessages[locale].continue}</Link></section>}
        {sample ? (
          /* Nothing is locked on the sample, so it closes by inviting the test, not by quoting a price. */
          <SampleCta priceLabel={price} secondary={{ href: href(locale, `/report/${SAMPLE_RESULT_ID}`), label: t.readSample }} />
        ) : clear ? (
          <UnlockPanel
            priceLabel={price}
            secureNote={secureNote}
            action={
              <Suspense fallback={null}>
                <ResultActions {...actionProps} slot="panel" />
              </Suspense>
            }
          />
        ) : <section className="mx-[27px] mb-8 border-t border-line pt-6 md:mx-0">
          <h2 className="mb-4 text-[20px]">{t.unclearHeading}</h2>
          {result.owner ? <ReviewAnswers resultId={id} /> : <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "unclear_result")}>{t.startMine}</PrimaryButton>}
          {result.owner && result.unlocked && <PrimaryButton href={href(locale, `/report/${id}`)} className="mt-5 max-w-[300px]" {...trackAttrs("read_report", "unclear_result")}>{t.readPurchased}</PrimaryButton>}
        </section>}
        {/* A buyer who reopened this page inside a wallet app has no visitor cookie; the order number restores it. */}
        {!sample && !result.owner && clear && mode === "crypto" && (
          <section className="mx-[27px] mb-8 max-w-[560px] border-t border-line pt-6 md:mx-0" aria-labelledby="wallet-handoff">
            <h2 id="wallet-handoff" className="text-[20px] leading-[1.6]">{t.handoffHeading}</h2>
            <p className="mt-3 mb-5 text-[12px] leading-[2] text-mist">{t.handoffBody}</p>
            <RecoverReports returnTo={href(locale, `/result/${id}?unlock=1`)} />
          </section>
        )}
        <p className="mx-[25px] my-[25px] text-center text-[9px] text-[#829094] md:mx-0 md:mt-[25px] md:mb-[35px] md:text-[10px]">
          {t.closing}
        </p>
      </main>
      {sample ? (
        <Dock>
          <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
        </Dock>
      ) : clear ? (
        <Suspense fallback={null}>
          <ResultActions {...actionProps} slot="dock" />
        </Suspense>
      ) : <Dock><PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("retake_quiz", "dock")}>{t.retake}</PrimaryButton></Dock>}
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <TrackView event="result_view" params={{ questionnaire_id: result.questionnaireId, question_count: result.questionCount, is_sample: sample, result_owner: result.owner, result_clear: clear, result_unlocked: result.owner && result.unlocked }} />
      {!sample && result.owner && clear && !result.unlocked && <TrackView event="view_item" params={reportCommerce(currencyFor(locale), priceMinorFor(locale))} />}
    </>
  );
}
