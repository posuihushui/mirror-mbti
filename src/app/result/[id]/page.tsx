import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ResultActions } from "@/components/result/result-actions";
import { ResultChart } from "@/components/result/result-chart";
import { SampleCta } from "@/components/result/sample-cta";
import { TypeIntro } from "@/components/result/type-intro";
import { UnlockPanel } from "@/components/result/unlock-panel";
import { PreferenceReading } from "@/components/result/preference-reading";
import { ReviewAnswers } from "@/components/result/review-answers";
import Link from "next/link";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { appUrl, paymentMode, priceFen } from "@/lib/env";
import { hasClearPreference, profileMeta, typeMeta } from "@/lib/personality";
import { getQuestionnaire } from "@/lib/questionnaires";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { formatPriceFen, site } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (id === SAMPLE_RESULT_ID) {
    const { name, line } = typeMeta("INFJ");
    return {
      title: `报告示例 · INFJ ${name}`,
      description: `${line.replace("\n", "")} 观己 mirror 的示例性格画像：四维偏好雷达图与人格概览，并可免费阅读同版式的完整示例报告。`,
      alternates: { canonical: "/result/sample" },
      openGraph: { title: `INFJ ${name} · 报告示例`, description: "免费查看一份示例性格画像，并阅读同版式的完整示例报告。" },
    };
  }
  return { title: "你的性格画像", robots: { index: false, follow: false } };
}

export default async function ResultPage({ params }: Params) {
  const { id } = await params;
  const visitorId = id === SAMPLE_RESULT_ID ? null : await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) notFound();

  const { profile, sample } = result;
  const { name } = profileMeta(profile);
  const clear = hasClearPreference(profile);
  const price = formatPriceFen(priceFen());
  const mode = paymentMode();
  const secureNote = mode === "mock" ? "微信支付 · 支付前可再次确认" : "微信支付 · 安全加密";

  const actionProps = {
    resultId: result.id,
    type: profile.type,
    name,
    priceLabel: price,
    mode,
    owner: result.owner,
    unlocked: result.owner && result.unlocked,
    clear,
  } as const;

  const productJsonLd = sample
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "观己 mirror 完整人格报告",
        description: "性格总览、优势与盲点、关系与沟通、工作与成长四章完整人格分析报告。",
        brand: { "@type": "Brand", name: site.name },
        offers: {
          "@type": "Offer",
          price: price,
          priceCurrency: "CNY",
          availability: "https://schema.org/InStock",
          url: `${appUrl()}/result/sample`,
        },
      }
    : null;

  return (
    <>
      <AppHeader variant="page" title={sample ? "示例性格画像" : "你的性格画像"} backHref="/" />
      <main className="pt-[15px] pb-[110px] md:mx-auto md:max-w-[1150px] md:px-10 md:pt-0 md:pb-0">
        <p className="mx-[27px] mt-5 text-[12px] text-mist md:mx-0">{getQuestionnaire(result.questionnaireId)?.name ?? "历史版本"} · {result.questionCount} 题{sample ? " · 示例数据" : ""}</p>
        <section className="block md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-[58px] md:pb-[50px] xl:gap-20">
          <TypeIntro profile={profile} sample={sample} />
          <ResultChart profile={profile} />
        </section>
        <PreferenceReading profile={profile} />
        {sample ? (
          /* Nothing is locked on the sample, so it closes by inviting the test, not by quoting a price. */
          <SampleCta priceLabel={price} secondary={{ href: `/report/${SAMPLE_RESULT_ID}`, label: "阅读完整示例报告" }} />
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
          <h2 className="mb-4 text-[20px]">先理解答案，再决定下一步。</h2>
          {result.owner ? <ReviewAnswers resultId={id} /> : <PrimaryButton href="/quiz">开始我的测试</PrimaryButton>}
          {result.owner && result.unlocked && <PrimaryButton href={`/report/${id}`} className="mt-5 max-w-[300px]">阅读已购报告</PrimaryButton>}
        </section>}
        <nav aria-label="结果帮助" className="mx-[27px] mt-6 flex flex-wrap gap-6 text-[12px] md:mx-0">
          <Link href="/my/report" className="text-link" prefetch={false}>全部测试记录</Link>
          <Link href="/help" className="text-link">订单与测试帮助</Link>
        </nav>
        <p className="mx-[25px] my-[25px] text-center text-[9px] text-[#829094] md:mx-0 md:mt-[25px] md:mb-[35px] md:text-[10px]">
          认识自己是一段持续的旅程。这份画像用于自我探索，不定义你。
        </p>
      </main>
      {sample ? (
        <Dock>
          <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
        </Dock>
      ) : clear ? (
        <Suspense fallback={null}>
          <ResultActions {...actionProps} slot="dock" />
        </Suspense>
      ) : <Dock><PrimaryButton href="/quiz">重新探索自己</PrimaryButton></Dock>}
      {productJsonLd && <JsonLd data={productJsonLd} />}
    </>
  );
}
