import { ContinuationList } from "@/components/pairing/continuation-list";
import { listComparisonContinuations } from "@/lib/comparison-continuations";
import { resultPairingStatus } from "@/lib/comparisons";
import { guideCover, ReportGuideContent } from "@/components/report/report-invite";
import { giftCheckout } from "@/lib/pair-gifts";
import { ensureInviteCode, inviteLinkFor } from "@/lib/invite-codes";
import { invitePriceMinorFor } from "@/lib/env";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { formatPriceFen } from "@/lib/site";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TrackView } from "@/components/analytics/track-view";
import { AppHeader } from "@/components/site/app-header";
import { ReportBody, type ReportData, type ReportGuide } from "@/components/report/report-body";
import { SampleGuide, SampleNotice } from "@/components/report/sample-notice";
import { SampleCta } from "@/components/result/sample-cta";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { buildReportData } from "@/lib/report-content";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { pageMetadata } from "@/lib/seo";
import { getVisitorId } from "@/lib/session";
import { questionnaireLocale, questionnaireName } from "@/lib/questionnaires";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = pageMessages[locale].report;
  if (id === SAMPLE_RESULT_ID) {
    return pageMetadata({
      locale,
      title: t.sampleMetaTitle,
      description: t.sampleMetaDescription,
      path: "/report/sample",
    });
  }
  return { title: t.ownTitle, robots: { index: false, follow: false } };
}

/** Entitlement is checked here on the server; the client never decides who can read. */
export default async function ReportPage({ params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = pageMessages[locale].report;
  const visitorId = id === SAMPLE_RESULT_ID ? null : await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) notFound();
  if (!result.sample) {
    const resultLocale = questionnaireLocale(result.questionnaireId);
    if (resultLocale !== locale) redirect(href(resultLocale, `/report/${id}`));
    if (!result.owner) redirect(href(locale, `/result/${id}`));
    if (!result.unlocked) redirect(href(locale, `/result/${id}?unlock=1`));
  }

  const data: ReportData = buildReportData(result.profile, { sample: result.sample, locale });
  const [continuations, pairing] = !data.sample && visitorId
    ? await Promise.all([listComparisonContinuations(visitorId, id), resultPairingStatus(id, visitorId, locale)])
    : [[], null];
  const checkout = giftCheckout(locale);
  // Every unlocked report has an invite code; the first view creates it.
  const code = pairing && visitorId ? await ensureInviteCode(id, visitorId) : null;
  const invite = code ? { code, url: inviteLinkFor(locale, code) } : null;
  const invitePrice = `${paymentMessages[locale].currency}${formatPriceFen(invitePriceMinorFor(locale))}`;
  // The guide for two is the report's fifth tab: the paid report invites from it; the sample only shows what it is.
  const guide: ReportGuide = pairing
    ? { ...guideCover(locale, pairing), content: <ReportGuideContent locale={locale} resultId={id} profile={result.profile} checkout={checkout} status={pairing} invitePrice={invitePrice} invite={invite} /> }
    : { state: "sample", heading: pairingMessages[locale].heading, lead: pairingMessages[locale].summary, content: <SampleGuide profile={result.profile} /> };

  return (
    <>
      <AppHeader variant="page" title={data.sample ? t.sampleHeader : t.ownTitle} backHref={href(locale, `/result/${id}`)} path={data.sample ? "/report/sample" : undefined} />
      <ReportBody
        data={data}
        reportKey={data.sample ? "sample" : id}
        banner={<>{data.sample && <SampleNotice />}<p className="mx-6 my-4 text-xs text-mist md:mx-0 md:mt-0">{t.banner(questionnaireName(result.questionnaireId, locale) ?? pageMessages[locale].result.legacyVersion, result.questionCount)}</p></>}
        guide={guide}
        footer={data.sample ? <SampleCta /> : <div className="mx-6 md:mx-0"><ContinuationList items={continuations} locale={locale} surface="report" /></div>}
      />
      {data.sample && (
        <Dock>
          <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
        </Dock>
      )}
      <TrackView event="report_view" params={{ questionnaire_id: result.questionnaireId, question_count: result.questionCount, is_sample: data.sample }} />
    </>
  );
}
