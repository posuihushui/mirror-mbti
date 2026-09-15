import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { ReportBody, type ReportData } from "@/components/report/report-body";
import { SampleNotice } from "@/components/report/sample-notice";
import { SampleCta } from "@/components/result/sample-cta";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { paymentMode, priceFen } from "@/lib/env";
import { buildReportData } from "@/lib/report-content";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { formatPriceFen } from "@/lib/site";
import { getVisitorId } from "@/lib/session";
import { getQuestionnaire } from "@/lib/questionnaires";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (id === SAMPLE_RESULT_ID) {
    return {
      title: "示例报告 · INFJ 提倡者",
      description: "观己 mirror 的示例人格报告，与付费报告版式相同，只是数据来自一次示例作答：性格总览、优势与盲点、关系与沟通、工作与成长四章全文，可免费阅读。",
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

  const data: ReportData = buildReportData(result.profile, { sample: result.sample, demo: paymentMode() === "mock" });

  const price = formatPriceFen(priceFen());

  return (
    <>
      <AppHeader variant="page" title={data.sample ? "示例人格报告" : "完整人格报告"} backHref={`/result/${id}`} />
      <ReportBody
        data={data}
        banner={<>{data.sample && <SampleNotice />}<p className="mx-[25px] my-5 text-[12px] leading-[1.9] text-mist md:mx-0">{getQuestionnaire(result.questionnaireId)?.name ?? "历史版本"} · {result.questionCount} 题 · 基于本次四维偏好的场景解读</p></>}
        footer={data.sample ? <SampleCta priceLabel={price} /> : <nav aria-label="报告帮助" className="mx-[25px] flex flex-wrap gap-6 text-[12px] md:mx-0"><Link href="/my/report" prefetch={false} className="text-link">全部测试记录</Link><Link href="/help" className="text-link">订单与报告帮助</Link></nav>}
      />
      {data.sample && (
        <Dock>
          <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
        </Dock>
      )}
    </>
  );
}
