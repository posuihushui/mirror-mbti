import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { ReportBody, type ReportData } from "@/components/report/report-body";
import { SampleNotice } from "@/components/report/sample-notice";
import { SampleCta } from "@/components/result/sample-cta";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { paymentModeFor, priceLabelFor } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { buildReportData } from "@/lib/report-content";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { pageMetadata } from "@/lib/seo";
import { getVisitorId } from "@/lib/session";
import { getQuestionnaire, questionnaireLocale } from "@/lib/questionnaires";

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

  const data: ReportData = buildReportData(result.profile, { sample: result.sample, demo: paymentModeFor(locale) === "mock", locale });

  const price = priceLabelFor(locale);

  return (
    <>
      <AppHeader variant="page" title={data.sample ? t.sampleHeader : t.ownTitle} backHref={href(locale, `/result/${id}`)} path={data.sample ? "/report/sample" : undefined} />
      <ReportBody
        data={data}
        banner={<>{data.sample && <SampleNotice />}<p className="mx-[25px] my-5 text-[12px] leading-[1.9] text-mist md:mx-0">{t.banner(getQuestionnaire(result.questionnaireId)?.name ?? pageMessages[locale].result.legacyVersion, result.questionCount)}</p></>}
        footer={data.sample ? <SampleCta priceLabel={price} /> : <nav aria-label={t.navLabel} className="mx-[25px] flex flex-wrap gap-6 text-[12px] md:mx-0"><Link href={href(locale, "/my/report")} prefetch={false} className="text-link">{t.allRecords}</Link><Link href={href(locale, "/help")} className="text-link">{t.help}</Link></nav>}
      />
      {data.sample && (
        <Dock>
          <PrimaryButton href={href(locale, "/quiz")}>{t.start}</PrimaryButton>
        </Dock>
      )}
    </>
  );
}
