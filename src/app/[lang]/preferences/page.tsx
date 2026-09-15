import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { preferenceDimensions } from "@/lib/preference-content";

export const metadata: Metadata = { title: "四维人格偏好与复测说明", description: "了解 E/I、S/N、T/F、J/P 四对偏好，以及接近 50%、百分比和复测变化的含义。", alternates: { canonical: "/preferences" } };

export default function PreferencesPage() {
  return <><AppHeader variant="page" title="四维偏好" backHref="/" />
    <main className="mx-auto max-w-[760px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">UNDERSTAND YOUR PREFERENCES</p>
      <h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">四对偏好，没有哪一端更好。</h1>
      <p className="mt-5 text-[13px] leading-[2] text-mist">这里使用四维偏好作为自我观察的语言。问卷为原创体验，并非官方 MBTI 量表；类型称呼不代表能力、职业适配或心理诊断。</p>
      {preferenceDimensions.map((d) => <section key={d.title} className="mt-7 border-t border-line pt-6">
        <h2 className="text-[20px]">{d.pair} · {d.title}</h2>
        <p className="mt-4 text-[13px] leading-[2] text-mist">{d.description}</p>
        <p className="mt-3 text-[13px] leading-[2]">观察问题：{d.question}</p>
      </section>)}
      <section className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">如何理解接近 50%？</h2><p className="mt-4 text-[13px] leading-[2] text-mist">50% 表示本次该维度两侧回答相抵，并不证明你具有两侧同等能力。页面将 50%–60% 的较高侧分数作为“接近均衡”的展示区间；这是产品的解释规则，不是经过验证的统计置信区间。四维都在这个区间时暂不生成确定类型，也不提供新的付费解锁。</p></section>
      <section className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">复测时，先看发生了什么。</h2><p className="mt-4 text-[13px] leading-[2] text-mist">近期的角色、精力、经历和对题意的理解都可能改变答案。记录测试版本、时间和具体情境，先比较维度变化，再看字母。百分比不是能力分、准确率或人群百分位；32 题与 64 题尚未做等值校准，不能把跨版本分数直接当成同一尺度。</p></section>
      <div className="mt-8 flex flex-col gap-5"><PrimaryButton href="/quiz">选择版本，开始探索</PrimaryButton><Link href="/types" className="text-link">浏览 16 型人格</Link></div>
    </main></>;
}
