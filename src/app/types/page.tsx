import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { names, TYPES } from "@/lib/personality";

export const metadata: Metadata = {
  title: "16 种人格倾向",
  description: "观己 mirror 的 16 种人格倾向一览：提倡者、调停者、建筑师、逻辑学家、主人公、竞选者等，每一种都附有简短概览。",
  alternates: { canonical: "/types" },
};

export default function TypesPage() {
  return (
    <>
      <AppHeader variant="page" title="16 种人格倾向" backHref="/" />
      <main className="mx-auto max-w-[1100px] px-[27px] pt-4 pb-[135px] md:px-10 md:pt-[60px] md:pb-[80px]">
        <p className="eyebrow text-[#738087]">SIXTEEN WAYS OF BEING</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{"十六种倾向，\n没有一种比另一种更好。"}</h1>
        <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">
          四个维度各有两种偏好，组合成十六种倾向。它们描述的是你在这次作答中的偏向，而不是给你贴上的标签。
        </p>
        <ul className="mt-10 grid list-none grid-cols-2 gap-px bg-line p-0 md:grid-cols-4">
          {TYPES.map((t) => {
            const [name, line] = names[t];
            return (
              <li key={t} className="bg-paper">
                <Link href={`/types/${t}`} className="group flex h-full flex-col gap-3 px-4 py-6 md:px-6 md:py-8">
                  <span className="text-[34px] leading-none font-medium tracking-[-0.055em] md:text-[40px]">{t}</span>
                  <span className="text-[12px] tracking-[0.08em] text-[#5c6a70]">{name}</span>
                  <span className="text-[11px] leading-[1.9] text-[#7d898e] whitespace-pre-line">{line}</span>
                  <span className="mt-auto flex items-center gap-2 text-[11px] text-[#5d696d] group-hover:text-ink">
                    了解这种倾向 <ArrowUpRight size={13} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 hidden md:block">
          <PrimaryButton href="/quiz" className="max-w-[246px]">
            开始认识自己
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href="/quiz">开始认识自己</PrimaryButton>
      </Dock>
    </>
  );
}
