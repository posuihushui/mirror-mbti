import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import portrait from "@/assets/portrait.jpg";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { OverlayButton } from "@/components/site/overlay-button";
import { StartButton } from "@/components/site/start-button";
import { priceFen } from "@/lib/env";
import { formatPriceFen, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: { canonical: "/" },
};

const steps = ["感受自己", "理解偏好", "找到相处方式"];

export default function HomePage() {
  const price = formatPriceFen(priceFen());
  return (
    <>
      <AppHeader variant="home" />
      <main className="md:mx-auto md:max-w-[1320px] md:px-11">
        <section className="relative block h-svh min-h-[720px] bg-[#e8eff1] md:grid md:bg-transparent md:h-[calc(100dvh-228px)] md:max-h-[790px] md:min-h-[630px] md:grid-cols-[1.12fr_1fr] md:gap-5 2xl:grid-cols-[1.1fr_1fr]">
          <div className="absolute inset-x-0 top-[220px] bottom-0 overflow-hidden md:relative md:col-start-2 md:row-start-1 md:mt-7 md:inset-auto">
            <Image
              src={portrait}
              alt="冷灰色光线下，闭眼沉思的女性侧脸"
              fill
              priority
              quality={82}
              sizes="(max-width: 720px) 100vw, 45vw"
              placeholder="blur"
              className="home-portrait-motion object-cover object-[48%_35%] md:object-[50%_50%]"
            />
            <div className="absolute right-[30px] bottom-[27px] left-[30px] hidden items-center justify-between gap-[10px] text-[10px] tracking-[0.06em] text-[#c9d2d5] md:flex">
              <span className="text-[9px] tracking-[0.14em]">THE WORLD WITHIN.</span>
              <span>从这里，靠近自己。</span>
            </div>
          </div>

          <div className="relative z-1 px-[27px] pt-[98px] md:col-start-1 md:row-start-1 md:self-center md:px-0 md:pt-5 md:pb-[45px]">
            <p className="eyebrow text-[8px] tracking-[0.17em] text-[#627176] md:text-[10px] md:tracking-[0.14em] md:text-ink">
              MBTI 测试体验 · 16 型人格探索
            </p>
            <h1 className="mt-[18px] text-[36px] leading-[1.4] tracking-[-0.055em] md:mt-[34px] md:text-[53px] md:leading-[1.32] md:tracking-[-0.065em] xl:text-[68px] 2xl:text-[77px]">
              <span className="home-title-motion inline-block">向内看见，</span>
              <br />
              <span className="home-title-motion home-title-motion-later inline-block">真实的自己<span className="text-[#999c98]">。</span></span>
            </h1>
            <p className="home-description-motion mt-[17px] text-[12px] leading-[1.9] text-[#677276] md:mt-[26px] md:text-[14px] md:leading-[2]">
              通过日常情境题，了解你的四维人格偏好。
              <br />
              原创自我探索问卷，非官方 MBTI 量表。
            </p>
            <div className="mt-[17px] flex items-center gap-[13px] md:mt-[42px] md:gap-[14px] xl:gap-6">
              {[
                ["32/64", "题可选"],
                ["5–10", "分钟左右"],
                ["16", "种人格倾向"],
              ].map(([n, l], i) => (
                <span
                  key={l}
                  className={
                    "flex items-center gap-1 text-[14px] font-medium whitespace-nowrap md:gap-[5px] md:text-[20px]" +
                    (i > 0 ? " border-l border-line pl-[13px] md:pl-[14px] xl:pl-6" : "")
                  }
                >
                  {n} <small className="text-[8px] font-normal text-[#5e7078] md:text-[11px] md:text-[#798286]">{l}</small>
                </span>
              ))}
            </div>
            <div className="mt-[41px] hidden grid-cols-[210px_1fr] items-center gap-x-4 gap-y-[13px] md:grid xl:grid-cols-[246px_1fr] xl:gap-x-7 xl:gap-y-3">
              <StartButton className="min-h-[58px]" />
              <Link href="/result/sample" className="text-link">
                先看看报告 <ArrowUpRight size={16} />
              </Link>
              <p className="col-span-full mt-[2px] text-[10px] text-[#707c80]">免费测试与性格概览 · 完整报告 ¥{price} / 次</p>
            </div>
          </div>
          <p className="absolute bottom-[7px] left-0 hidden text-[10px] tracking-[0.04em] text-[#899498] md:block">没有标准答案，只有更真实的你。</p>
        </section>

        <section className="mt-[30px] hidden items-center justify-between gap-5 border-t border-line py-[27px] text-[11px] md:flex">
          <span className="text-[9px] tracking-[0.1em] text-[#849195]">SELF-DISCOVERY, AT YOUR PACE.</span>
          {steps.map((s, i) => (
            <div key={s}>
              <b className="mr-[10px] font-normal text-[#8d9a9f]">0{i + 1}</b> {s}
            </div>
          ))}
          <OverlayButton overlay="about" className="flex items-center gap-4 text-[11px]">
            关于这次探索 <ArrowUpRight size={15} />
          </OverlayButton>
        </section>
        <nav aria-label="探索更多" className="mb-[125px] flex flex-wrap gap-x-7 gap-y-4 border-t border-line px-[27px] py-7 text-[12px] md:mb-0 md:px-0">
          <Link href="/preferences" className="text-link">了解四维偏好</Link>
          <Link href="/types" className="text-link">16 型人格</Link>
          <Link href="/about" className="text-link">测试说明</Link>
          <Link href="/help" className="text-link">测试与订单帮助</Link>
        </nav>
      </main>

      <Dock variant="home">
        <StartButton className="border-[3px] border-[#3e4343]" />
        <div className="flex items-center justify-between px-[3px] pt-[11px] text-[8px] text-[#b7c4c7]">
          <span className="text-[9px] text-[#52656e]">免费测试 · 完整报告 ¥{price}</span>
          <PrimaryLink />
        </div>
      </Dock>
    </>
  );
}

function PrimaryLink() {
  return (
    <Link href="/result/sample" className="flex items-center gap-[3px] py-[2px] text-[9px] text-[#d6e1e5]">
      报告示例
      <ArrowUpRight size={12} />
    </Link>
  );
}
