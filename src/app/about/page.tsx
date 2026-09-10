import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { priceFen } from "@/lib/env";
import { faqs, formatPriceFen, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "了解测试",
  description: "观己 mirror 人格测试说明：32 道原创情境题、约 5 分钟、免费查看类型与概览，完整报告一次解锁，无订阅无自动续费。",
  alternates: { canonical: "/about" },
};

/** Static "了解测试" page. The same copy also appears in the in-app sheet; this page exists for search and direct links. */
export default function AboutPage() {
  const price = formatPriceFen(priceFen());
  const items = faqs(price);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <>
      <AppHeader variant="page" title="关于这次探索" backHref="/" />
      <main className="mx-auto max-w-[560px] px-[27px] pt-4 pb-[135px] md:px-10 md:pt-[60px] md:pb-[80px]">
        <p className="eyebrow text-[#738087]">ABOUT · 了解测试</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">
          关于这次探索
        </h1>
        <p className="mt-[27px] text-[14px] leading-[2] text-[#78878e] whitespace-pre-line">
          {"认识自己，不是把自己放进一个盒子。\n是多一种理解自己的语言。"}
        </p>
        <dl className="mt-2">
          {items.map(([q, a]) => (
            <div key={q} className="border-t border-line">
              <dt className="py-[15px] text-[12px] leading-[1.7]">{q}</dt>
              <dd className="m-0 pb-5 text-[11px] leading-[2.1] text-[#6d7f88]">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-[10px] leading-[1.8] text-[#829094]">
          所有题目为独立原创的演示问卷，并非官方 MBTI 量表，也未经过心理测量学验证。结果用于自我探索，不用于诊断、招聘筛选或给他人贴标签。
        </p>
        <div className="mt-6 hidden md:block">
          <PrimaryButton href="/quiz" className="max-w-[246px]">
            开始认识自己
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
      </Dock>
      <JsonLd data={faqJsonLd} />
      <span className="sr-only">{site.name}</span>
    </>
  );
}
