import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { EmptyReportContent } from "@/components/site/empty-report-content";
import { latestResultForVisitor } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

export const metadata: Metadata = { title: "我的报告", robots: { index: false, follow: false } };

/** Resolves "我的报告" for the current visitor: unlocked → report, scored → result, nothing → empty state. */
export default async function MyReportPage() {
  const visitorId = await getVisitorId();
  const latest = visitorId ? await latestResultForVisitor(visitorId) : null;
  if (latest) redirect(latest.unlocked ? `/report/${latest.id}` : `/result/${latest.id}`);

  return (
    <>
      <AppHeader variant="page" title="我的报告" backHref="/" />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-[120px] md:pt-[60px]">
        <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em]">属于你的故事，还未开始。</h1>
        <p className="mt-2 text-[11px] text-[#78878e]">完成测试后，在这里找回本次的性格报告。</p>
        <EmptyReportContent />
      </main>
    </>
  );
}
