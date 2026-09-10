import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";

export const metadata: Metadata = { title: "页面不存在" };

export default function NotFound() {
  return (
    <>
      <AppHeader variant="page" title="页面不存在" backHref="/" />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-[120px] md:pt-[60px]">
        <p className="eyebrow text-[#738087]">404</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{"这一页还没有故事。\n回到开始的地方。"}</h1>
        <p className="mt-[23px] text-[13px] leading-[1.9] text-[#6b777d]">链接可能已过期，或者结果属于另一位访客。你可以回到首页重新开始。</p>
        <div className="mt-8 hidden md:block">
          <PrimaryButton href="/" className="max-w-[246px]">
            回到首页
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href="/">回到首页</PrimaryButton>
      </Dock>
    </>
  );
}
