"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { useQuizDrafts, writeQuizProgress } from "@/lib/client-storage";
import { emptyProgress } from "@/lib/quiz-progress";
import { questionnaires } from "@/lib/questionnaires";

export function QuizVersions({ onChoose, priceLabel }: { onChoose: () => void; priceLabel: string }) {
  const { drafts } = useQuizDrafts();
  return (
    <main className="mx-auto max-w-[1000px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">MBTI 测试体验 · 选择版本</p>
      <h1 className="mt-[18px] text-[27px] leading-[1.6] md:text-[38px]">按你的节奏，开始探索。</h1>
      <p className="mt-4 max-w-[650px] text-[13px] leading-[2] text-mist">回想最近一段时间的日常状态，而非理想中的自己。原创自我探索问卷，非官方 MBTI 量表；两个版本均未经过心理测量学验证，题量更多不代表更准确。</p>
      <div className="mt-8 grid gap-7 md:grid-cols-2">
        {questionnaires.map((q) => {
          const draft = drafts[q.id];
          const answered = draft ? Object.values(draft.answers).filter((a) => a !== null).length : 0;
          return (
            <section key={q.id} className="flex flex-col gap-5 border-t border-line pt-6" aria-label={`${q.count} 题${q.name}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[23px]">{q.count} 题 · {q.name}</h2>
                <Badge>{q.count === 64 ? "更多场景" : "快速体验"}</Badge>
              </div>
              <p className="text-[12px] text-mist">{q.duration} · 每个维度 {q.count / 4} 题</p>
              <p className="min-h-12 text-[13px] leading-[2] text-mist">{q.description}</p>
              {answered > 0 && <p className="text-[12px]">已保存 {answered}/{q.count} 题，可接着上次的位置继续。</p>}
              <PrimaryButton onClick={() => { writeQuizProgress(draft ?? emptyProgress(q.id)); onChoose(); }}>
                {answered > 0 ? `继续 ${q.count} 题${q.name}` : `开始 ${q.count} 题${q.name}`}
              </PrimaryButton>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-[12px] leading-[2] text-mist">各版本进度分别保存，可暂停、检查已答题或重新开始。预计用时为初步估计，跨版本分数不宜直接比较。测试与概览免费，完整报告 ¥{priceLabel} / 次。</p>
      <nav aria-label="测试帮助" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[12px]">
        <Link href="/about" className="text-link">测试说明</Link><Link href="/preferences" className="text-link">了解四维偏好</Link><Link href="/help" className="text-link">续答与订单帮助</Link>
      </nav>
    </main>
  );
}
