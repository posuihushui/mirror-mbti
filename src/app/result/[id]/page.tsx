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
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { appUrl, paymentMode, priceFen } from "@/lib/env";
import { typeMeta } from "@/lib/personality";
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
  const { name } = typeMeta(profile.type);
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
    unlocked: result.unlocked,
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
      <AppHeader variant="page" title="你的性格画像" backHref="/" />
      <main className="pt-[15px] pb-[110px] md:mx-auto md:max-w-[1150px] md:px-10 md:pt-0 md:pb-0">
        <section className="block md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-[58px] md:pb-[50px] xl:gap-20">
          <TypeIntro profile={profile} sample={sample} />
          <ResultChart profile={profile} />
        </section>
        {sample ? (
          /* Nothing is locked on the sample, so it closes by inviting the test, not by quoting a price. */
          <SampleCta priceLabel={price} secondary={{ href: `/report/${SAMPLE_RESULT_ID}`, label: "阅读完整示例报告" }} />
        ) : (
          <UnlockPanel
            priceLabel={price}
            secureNote={secureNote}
            action={
              <Suspense fallback={null}>
                <ResultActions {...actionProps} slot="panel" />
              </Suspense>
            }
          />
        )}
        <p className="mx-[25px] my-[25px] text-center text-[9px] text-[#829094] md:mx-0 md:mt-[25px] md:mb-[35px] md:text-[10px]">
          认识自己是一段持续的旅程。这份画像用于自我探索，不定义你。
        </p>
      </main>
      {sample ? (
        <Dock>
          <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
        </Dock>
      ) : (
        <Suspense fallback={null}>
          <ResultActions {...actionProps} slot="dock" />
        </Suspense>
      )}
      {productJsonLd && <JsonLd data={productJsonLd} />}
    </>
  );
}
