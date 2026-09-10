import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { RecoverReports } from "@/components/report/recover-reports";
import { poles, typeMeta } from "@/lib/personality";
import { resultsForVisitor, type ResultHistoryItem } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

export const metadata: Metadata = { title: "我的报告", robots: { index: false, follow: false } };

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
});

/** The loading boundary keeps history request-scoped; each report still checks access on its server route. */
export default async function MyReportPage() {
  const visitorId = await getVisitorId();
  const results = visitorId ? await resultsForVisitor(visitorId) : [];
  const hasHistory = results.length > 0;

  return (
    <>
      <AppHeader variant="page" title="我的报告" backHref="/" />
      <main className="mx-auto max-w-[1000px] px-[27px] pt-7 pb-[80px] md:px-10 md:pt-[55px]">
        <p className="eyebrow text-mist">YOUR EXPLORATIONS</p>
        <div className="mt-[18px] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[38px]">
              {hasHistory ? "每一次探索，都在这里。" : "还没有找到你的测试记录。"}
            </h1>
            <p className="mt-3 text-[12px] leading-[2] text-mist md:text-[13px]">
              {hasHistory
                ? `共 ${results.length} 份测试记录。简要结果免费查看，已支付的报告可继续阅读全文。`
                : "完成测试后，可以在这里查看记录。如果换了设备或清除了浏览器数据，也可以通过订单号找回。"}
            </p>
          </div>
          <PrimaryButton href="/quiz" className="md:w-[200px] md:shrink-0">{hasHistory ? "继续探索自己" : "开始测试"}</PrimaryButton>
        </div>
        {hasHistory ? (
          <>
            <section className="mt-[35px] flex flex-col gap-6 md:mt-[45px]" aria-label="全部测试记录">
              {results.map((result) => <HistoryItem key={result.id} result={result} />)}
            </section>
            <p className="mt-7 text-[11px] leading-[1.9] text-mist">
              已创建订单的记录可以保存订单号。换设备时，输入其中任意一个订单号，即可找回同一用户的全部测试记录。
            </p>
            <Accordion type="single" collapsible className="mt-6 max-w-[560px]">
              <AccordionItem value="recover">
                <AccordionTrigger>找回其他测试记录</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-6 text-[12px] leading-[2] text-mist">找回后将切换到订单所属用户，不合并两边的记录。切换前，请保存当前用户的订单号，以便再次找回。</p>
                  <RecoverReports />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <section className="mt-[38px] max-w-[560px] border-t border-line pt-[30px]" aria-labelledby="recovery-title">
            <h2 id="recovery-title" className="text-[20px] leading-[1.6]">用订单号，找回之前的探索。</h2>
            <p className="mt-3 mb-6 text-[12px] leading-[2] text-mist">
              输入本网站的完整订单号，自动展示该用户的所有测试记录。找回不会改变各份报告的支付状态。
            </p>
            <RecoverReports />
            <Link href="/result/sample" className="text-link mt-6">先看看报告示例 <ArrowUpRight size={16} /></Link>
          </section>
        )}
      </main>
    </>
  );
}

function HistoryItem({ result }: { result: ResultHistoryItem }) {
  const { profile, order, unlocked, createdAt } = result;
  const { name, summary } = typeMeta(profile.type);
  const demo = order?.provider === "mock";
  return (
    <article aria-label={`${profile.type} 测试记录`} className="border border-line px-[22px] py-6 md:px-[30px] md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {createdAt && <time dateTime={createdAt.toISOString()} className="text-[11px] text-mist">{dateFormat.format(createdAt)}</time>}
        <Badge variant={unlocked ? "unlocked" : "tag"}>{unlocked ? `已解锁${demo ? " · 演示" : ""}` : "简要结果 · 免费"}</Badge>
      </div>
      <div className="mt-5 flex items-baseline gap-3">
        <h2 className="text-[38px] font-medium tracking-[-0.06em] md:text-[44px]">{profile.type}</h2>
        <span className="text-[12px]">{name}</span>
      </div>
      <p className="mt-3 max-w-[680px] text-[12px] leading-[2] text-mist md:text-[13px]">{summary}</p>
      <dl className="mt-6 grid grid-cols-4 border-y border-line py-4">
        {profile.type.split("").map((letter, i) => (
          <div key={letter} className="flex flex-col gap-2 text-center not-first:border-l not-first:border-line">
            <dt className="text-[10px] text-mist">{poles[letter].label} {letter}</dt>
            <dd className="text-[20px]">{profile.values[i]}<span className="text-[11px]">%</span></dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PrimaryButton href={unlocked ? `/report/${result.id}` : `/result/${result.id}`} prefetch={false} className="md:w-[220px]">
          {unlocked ? "阅读详细报告" : "查看简要结果"}
        </PrimaryButton>
        <Link href={unlocked ? `/result/${result.id}` : `/result/${result.id}?unlock=1`} prefetch={false} className="text-link justify-center text-[12px]">
          {unlocked ? "查看简要结果" : "解锁详细报告"} <ArrowUpRight size={16} />
        </Link>
      </div>
      {order && (
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="order">
            <AccordionTrigger>订单与找回凭据{demo ? " · 演示" : ""}</AccordionTrigger>
            <AccordionContent><OrderReceipt orderId={order.id} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </article>
  );
}
