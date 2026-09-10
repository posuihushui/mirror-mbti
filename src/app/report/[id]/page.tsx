import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { ReportBody, type ReportData } from "@/components/report/report-body";
import { paymentMode } from "@/lib/env";
import { buildReportData } from "@/lib/report-content";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (id === SAMPLE_RESULT_ID) {
    return {
      title: "完整报告示例 · INFJ 提倡者",
      description: "观己 mirror 完整人格报告示例：性格总览、优势与盲点、关系与沟通、工作与成长四章。",
      // /result/sample carries the same reading plus the profile, so it owns the sample in search.
      alternates: { canonical: "/result/sample" },
    };
  }
  return { title: "完整人格报告", robots: { index: false, follow: false } };
}

/** Entitlement is checked here on the server; the client never decides who can read. */
export default async function ReportPage({ params }: Params) {
  const { id } = await params;
  const visitorId = id === SAMPLE_RESULT_ID ? null : await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) notFound();
  if (!result.sample) {
    if (!result.owner) redirect(`/result/${id}`);
    if (!result.unlocked) redirect(`/result/${id}?unlock=1`);
  }

  const data: ReportData = buildReportData(result.profile, { sample: result.sample, demo: paymentMode() === "mock" });

  return (
    <>
      <AppHeader variant="page" title="完整人格报告" backHref={`/result/${id}`} />
      <ReportBody data={data} />
    </>
  );
}
