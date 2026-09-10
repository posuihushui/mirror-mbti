"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { cn } from "cn";
import { toast } from "sonner";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuizProgress, writeLastResultId, writeQuizProgress, type QuizProgress } from "@/lib/client-storage";
import { QUESTION_COUNT, questions } from "@/lib/personality";
import { choices } from "@/lib/site";
import { pad2 } from "@/lib/utils";

const EMPTY_ANSWERS: (number | null)[] = Array<number | null>(QUESTION_COUNT).fill(null);

type CreateResultResponse = { ok: true; data: { id: string } } | { ok: false; error: { code: string; message: string } };

/** The questionnaire island: answers and position persist in localStorage; scoring happens on the server. */
export function Quiz() {
  const router = useRouter();
  const progress = useQuizProgress();
  const answers = progress?.answers ?? EMPTY_ANSWERS;
  const index = Math.min(Math.max(progress?.index ?? 0, 0), QUESTION_COUNT - 1);
  const [submitting, setSubmitting] = useState(false);

  const save = (patch: Partial<Pick<QuizProgress, "answers" | "index">>) => {
    writeQuizProgress({ answers, index, ...patch });
  };

  const answered = answers.filter((a) => a !== null).length;
  const current = answers[index];
  const last = index === QUESTION_COUNT - 1;

  const select = (v: number) => {
    const nextAnswers = [...answers];
    nextAnswers[index] = v;
    save({ answers: nextAnswers });
  };

  const back = () => {
    if (index > 0) save({ index: index - 1 });
  };

  const next = async () => {
    if (current === null || submitting) return;
    if (!last) {
      save({ index: index + 1 });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = (await res.json()) as CreateResultResponse;
      if (!json.ok) throw new Error(json.error.message);
      writeLastResultId(json.data.id);
      writeQuizProgress(null);
      router.push(`/result/${json.data.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "提交失败，请稍后重试");
      setSubmitting(false);
    }
  };

  const nextLabel = submitting ? "正在生成结果…" : last ? "查看我的结果" : "下一题";

  return (
    <>
      <main className="block max-w-[510px] px-[26px] pt-4 pb-[135px] md:mx-auto md:grid md:max-w-[1140px] md:grid-cols-2 md:gap-[70px] md:px-10 md:pt-[60px] md:pb-[55px] xl:gap-[125px]">
        <aside className="hidden md:block md:pt-5">
          <p className="eyebrow">DISCOVER YOUR TYPE</p>
          <h1 className="mt-[35px] text-[45px] leading-[1.5]">{"不必成为谁。\n只要是你自己。"}</h1>
          <p className="mt-[26px] text-[13px] text-[#6d797e] whitespace-pre-line">{"回想最近一段时间的日常，\n选择最接近真实状态的答案。"}</p>
          <div className="mt-[75px] flex items-baseline">
            <strong className="text-[98px] font-normal tracking-[-0.08em]">{pad2(index + 1)}</strong>
            <span className="pl-[14px] text-[16px] text-[#869196]"> / {QUESTION_COUNT}</span>
          </div>
          <p className="text-[10px] text-[#6d797e]">跟随第一感觉，也可以返回修改。</p>
        </aside>

        <section className="md:max-w-[460px]">
          <div className="flex items-center justify-between text-[11px] text-[#758287]">
            <span className="text-[27px] font-[650] text-ink md:text-[23px]">
              {pad2(index + 1)} <small className="text-[13px] font-normal text-[#8b969b]">/ {QUESTION_COUNT}</small>
            </span>
            <span>已完成 {Math.round((answered / QUESTION_COUNT) * 100)}%</span>
          </div>
          <Progress value={answered} max={QUESTION_COUNT} className="mt-[15px] h-[2px]" aria-label="测试完成进度" />

          <div className="animate-appear" key={index}>
            <p className="eyebrow mt-9 text-[9px] font-normal text-[#859297] md:mt-[42px] md:text-[10px]">跟随你的第一感觉</p>
            <h2 id="question-title" className="mt-[18px] min-h-[86px] text-[24px] leading-[1.6] tracking-[-0.03em] md:text-[27px]">
              {questions[index].text}
            </h2>
            <div className="mt-[27px] flex flex-col gap-[9px] md:mt-[29px]" role="group" aria-labelledby="question-title">
              {choices.map(({ v, l }) => {
                const selected = current === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => select(v)}
                    className={cn(
                      "flex min-h-[55px] items-center justify-between rounded-[3px] border border-[#cfd9dc] px-[17px] text-left text-[14px] transition-colors duration-150 hover:bg-[#e3e9ea] md:px-5 md:text-[13px]",
                      selected && "border-[#1c2223] bg-[#1c2223] text-[#f7fafa] hover:bg-[#1c2223]",
                    )}
                  >
                    <span>{l}</span>
                    <span
                      className={cn(
                        "flex size-[19px] items-center justify-center rounded-full border border-[#abb8bd]",
                        selected && "border-[#f3f5f6] bg-[#f3f5f6] text-[#242929]",
                      )}
                    >
                      {selected && <Check size={15} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] text-[#7d898e] md:text-[10px]">没有好坏之分，选择符合日常的你。</p>

          <div className="mt-[33px] hidden items-center justify-between gap-[30px] md:flex">
            <Button variant="back" disabled={index === 0} onClick={back} className="text-[13px]">
              <ArrowLeft size={17} />
              上一题
            </Button>
            <PrimaryButton disabled={current === null || submitting} onClick={next} className="w-[180px] min-h-[52px]">
              {nextLabel}
            </PrimaryButton>
          </div>
        </section>
      </main>

      <Dock>
        <div className="flex items-center justify-between gap-[30px]">
          <Button variant="back" disabled={index === 0} onClick={back} className="min-w-[75px] gap-2 text-[11px]">
            <ArrowLeft size={17} />
            上一题
          </Button>
          <PrimaryButton disabled={current === null || submitting} onClick={next} className="max-w-[190px] min-h-[52px]">
            {submitting ? "生成中…" : last ? "查看结果" : "下一题"}
          </PrimaryButton>
        </div>
      </Dock>
    </>
  );
}
