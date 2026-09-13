import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { appUrl } from "@/lib/env";
import { isPersonalityType, poles, TYPES, typeMeta } from "@/lib/personality";
import { site } from "@/lib/site";
import { typeContext } from "@/lib/type-context";

type Params = { params: Promise<{ type: string }> };

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { type } = await params;
  if (!isPersonalityType(type)) return {};
  const { name, line, summary } = typeMeta(type);
  return {
    title: `${type} ${name}`,
    description: `${line.replace("\n", "")} ${summary}`,
    alternates: { canonical: `/types/${type}` },
    openGraph: { title: `${type} ${name} · ${site.name}`, description: summary },
  };
}

export default async function TypePage({ params }: Params) {
  const { type } = await params;
  if (!isPersonalityType(type)) notFound();
  const { name, line, summary, letters } = typeMeta(type);
  const context = typeContext(type);
  const url = appUrl();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: url },
      { "@type": "ListItem", position: 2, name: "16 种人格倾向", item: `${url}/types` },
      { "@type": "ListItem", position: 3, name: `${type} ${name}`, item: `${url}/types/${type}` },
    ],
  };

  return (
    <>
      <AppHeader variant="page" title="16 种人格倾向" backHref="/types" />
      <main className="pt-[15px] pb-[120px] md:mx-auto md:max-w-[1150px] md:px-10 md:pt-0 md:pb-[70px]">
        <section className="block md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-[58px] md:pb-[50px] xl:gap-20">
          <div className="px-[27px] pt-[17px] pb-[35px] md:p-0">
            <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">PERSONALITY TYPE · 人格倾向</p>
            <div className="my-6 flex items-baseline gap-[17px] text-[79px] leading-[1.15] font-medium tracking-[-0.055em] md:mt-6 md:mb-[22px] md:gap-[22px] md:text-[102px]">
              {type}
              <span className="text-[14px] font-normal tracking-[0.08em] md:text-[16px]">{name}</span>
            </div>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{line}</h1>
            <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">{summary}</p>
            <div className="mt-6 flex gap-2">
              {letters.slice(0, 3).map((l) => (
                <Badge key={l}>{poles[l].label}倾向</Badge>
              ))}
            </div>
          </div>
          <div className="border-t border-line px-[27px] pt-[25px] pb-[35px] md:border-t-0 md:border-l md:pt-[15px] md:pr-0 md:pb-0 md:pl-[35px]">
            <div className="flex justify-between text-[10px] text-[#58676d] md:text-[11px]">
              <span>四个维度，四种需要</span>
              <span className="text-[9px] text-[#8c999e]">01 — 04</span>
            </div>
            <ul className="mt-5 list-none p-0">
              {letters.map((l, i) => (
                <li key={l} className="flex gap-4 border-b border-line py-5">
                  <span className="pt-[3px] text-[9px] text-[#a38f7a]">0{i + 1}</span>
                  <div>
                    <h2 className="text-[14px] font-medium tracking-normal">
                      {poles[l].label} <small className="ml-1 text-[#8a969b]">{l}</small>
                      <span className="ml-3 text-[11px] font-normal text-[#758287]">{poles[l].need}</span>
                    </h2>
                    <p className="mt-2 text-[12px] leading-[2] text-[#6b777d]">{poles[l].strength}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-[23px] text-[9px] leading-[1.8] text-[#7f8e94]">
              以上描述来自四个维度的偏好，具体强度以你本次作答的百分比为准。人格倾向会随情境变化，结果用于自我探索。
            </p>
          </div>
        </section>
        <section className="mx-[27px] mb-8 border-t border-line pt-7 md:mx-0">
          <h2 className="text-[22px]">在日常里，可能是什么样？</h2>
          <p className="mt-4 text-[13px] leading-[2] text-mist">{context.everyday.join("")}这些只是供对照的情境，不是每个同类型的人都会如此。</p>
          <h3 className="mt-6 text-[18px]">常见误解</h3>
          <ul className="mt-3 flex list-disc flex-col gap-3 pl-5 text-[13px] leading-[2] text-mist">{context.misconceptions.map((text) => <li key={text}>{text}</li>)}</ul>
          <h3 className="mt-6 text-[18px]">一次具体的沟通</h3>
          <p className="mt-3 text-[13px] leading-[2] text-mist">“{context.communication}”先描述自己的实际需要，再听听对方，不用类型标签替双方下结论。</p>
          <h3 className="mt-6 text-[18px]">如果一个维度换到另一端</h3>
          <p className="mt-3 text-[12px] leading-[2] text-mist">相邻类型只差一对偏好。接近均衡时可以同时对照两种描述，不必把字母变化理解为性格突然改变。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{context.neighbors.map((neighbor) => <Link key={neighbor.type} href={`/types/${neighbor.type}`} className="text-link min-h-11">{neighbor.type} {typeMeta(neighbor.type).name} · {neighbor.dimension.split("").join(" / ")}</Link>)}</div>
        </section>
        <section className="mx-4 bg-night-deep px-[27px] py-8 text-[#eff3f4] md:mx-0 md:flex md:items-center md:justify-between md:gap-10 md:p-10 xl:px-[60px] xl:py-14">
          <div>
            <p className="eyebrow text-[9px] text-[#99a6a9]">IS THIS YOU?</p>
            <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{"选择适合的版本，\n看看你的答案。"}</h2>
          </div>
          <div className="mt-[30px] flex flex-col gap-4 md:mt-0 md:w-[300px]">
            <div className="hidden md:block">
              <PrimaryButton href="/quiz" light>
                开始认识自己
              </PrimaryButton>
            </div>
            <Link href="/types" className="text-link text-[12px] text-[#d8e0e2]">
              查看全部 16 种倾向 <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <Dock>
        <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
      </Dock>
      <JsonLd data={breadcrumb} />
    </>
  );
}
