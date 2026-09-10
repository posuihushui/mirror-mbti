import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { ReportView, type ReportData } from "@/components/report/report-view";
import { paymentMode } from "@/lib/env";
import { typeMeta } from "@/lib/personality";
import { blindspotInsights, relationshipInsights, strengthInsights, workInsights } from "@/lib/report-content";
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
      alternates: { canonical: "/report/sample" },
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

  const { profile, sample } = result;
  const { name, line, summary, letters } = typeMeta(profile.type);
  const data: ReportData = {
    profile,
    name,
    line,
    summary,
    sample,
    demo: paymentMode() === "mock",
    strengths: strengthInsights(letters),
    blindspots: blindspotInsights(letters),
    relationships: relationshipInsights(letters),
    work: workInsights(letters),
  };

  return (
    <>
      <AppHeader variant="page" title="完整人格报告" backHref={`/result/${id}`} />
      <Suspense fallback={null}>
        <ReportView data={data} />
      </Suspense>
    </>
  );
}
