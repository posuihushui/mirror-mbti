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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { QuizVersions } from "@/components/quiz/quiz-versions";
import { useQuizProgress, useStorageAvailable, writeLastResultId, writeQuizProgress, type QuizProgress } from "@/lib/client-storage";
import { getQuestionnaire } from "@/lib/questionnaires";
import { emptyProgress } from "@/lib/quiz-progress";
import { choices } from "@/lib/site";
import { pad2 } from "@/lib/utils";

type CreateResultResponse = { ok: true; data: { id: string } } | { ok: false; error: { code: string; message: string } };

/** The questionnaire island: answers and position persist in localStorage; scoring happens on the server. */
export function Quiz({ priceLabel }: { priceLabel: string }) {
  const progress = useQuizProgress();
  const [choosing, setChoosing] = useState(false);
  if (!progress || choosing) return <QuizVersions priceLabel={priceLabel} onChoose={() => setChoosing(false)} />;
  return <QuizRunner key={progress.questionnaireId} progress={progress} onChoose={() => setChoosing(true)} />;
}

function QuizRunner({ progress, onChoose }: { progress: QuizProgress; onChoose: () => void }) {
  const router = useRouter();
  const questionnaire = getQuestionnaire(progress.questionnaireId)!;
  const questions = questionnaire.questions;
  const count = questionnaire.count;
  const { answers, index } = progress;
  const storageAvailable = useStorageAvailable();
  const [submitting, setSubmitting] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);

  const save = (patch: Partial<Pick<QuizProgress, "answers" | "index">>) => {
    writeQuizProgress({ ...progress, ...patch });
  };

  const answered = Object.values(answers).filter((a) => a !== null).length;
  const current = answers[questions[index].id];
  const last = index === count - 1;

  const select = (v: number) => {
    save({ answers: { ...answers, [questions[index].id]: v } });
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
    const missing = questions.findIndex((q) => answers[q.id] === null);
    if (missing >= 0) { save({ index: missing }); toast("请先补全未回答的题目"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionnaireId: questionnaire.id, answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] })) }),
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
  const mobileNextLabel = submitting ? "生成中…" : last ? "查看结果" : "下一题";

  return (
    <>
      <main className="block max-w-[510px] px-[26px] pt-4 pb-[135px] md:mx-auto md:grid md:max-w-[1140px] md:grid-cols-2 md:gap-[70px] md:px-10 md:pt-[60px] md:pb-[55px] xl:gap-[125px]">
        <aside className="hidden md:block md:pt-5">
          <p className="eyebrow">DISCOVER YOUR TYPE</p>
          <h1 className="mt-[35px] text-[45px] leading-[1.5]">{"不必成为谁。\n只要是你自己。"}</h1>
          <p className="mt-[26px] text-[13px] text-[#6d797e] whitespace-pre-line">{"回想最近一段时间的日常，\n选择最接近真实状态的答案。"}</p>
          <div className="mt-[75px] flex items-baseline">
            <strong className="text-[98px] font-normal tracking-[-0.08em]">{pad2(index + 1)}</strong>
            <span className="pl-[14px] text-[16px] text-[#869196]"> / {count}</span>
          </div>
          <p className="text-[10px] text-[#6d797e]">跟随第一感觉，也可以返回修改。</p>
        </aside>

        <section className="md:max-w-[460px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-mist">
            <span>{questionnaire.name} · {count} 题</span>
            <Button variant="link" onClick={onChoose} disabled={submitting} className="min-h-11">切换版本</Button>
          </div>
          {!storageAvailable && <Alert className="mb-5"><AlertTitle>当前进度仅保存在本页</AlertTitle><AlertDescription>浏览器暂时无法保存数据，但可以继续作答。刷新或关闭页面可能丢失未提交的进度。</AlertDescription></Alert>}
          <div className="flex items-center justify-between text-[11px] text-[#758287]">
            <span className="text-[27px] font-[650] text-ink md:text-[23px]">
              {pad2(index + 1)} <small className="text-[13px] font-normal text-[#8b969b]">/ {count}</small>
            </span>
            <span>已答 {answered}/{count} 题</span>
          </div>
          <Progress value={answered} max={count} className="mt-[15px] h-[2px]" aria-label="测试完成进度" />

          <div className="animate-appear" key={index}>
            <p className="eyebrow mt-9 text-[9px] font-normal text-[#859297] md:mt-[42px] md:text-[10px]">跟随你的第一感觉</p>
            <h2 id="question-title" aria-live="polite" aria-atomic="true" className="mt-[18px] min-h-[86px] text-[24px] leading-[1.6] tracking-[-0.03em] md:text-[27px]">
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
                    onClick={() => select(v)} disabled={submitting}
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
          <Accordion type="single" collapsible className="mt-5">
            <AccordionItem value="answers"><AccordionTrigger>检查已答题 · {answered}/{count}</AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-[12px] text-mist">点击题号返回修改。带 ✓ 的题目已回答。</p>
                <div className="grid grid-cols-6 gap-2 md:grid-cols-8">
                  {questions.map((q, i) => <Button key={q.id} disabled={submitting} onClick={() => save({ index: i })} className="min-h-11 justify-center border border-line text-[12px]" aria-label={`第 ${i + 1} 题，${answers[q.id] === null ? "未作答" : "已作答"}`} aria-current={index === i ? "step" : undefined}>{i + 1}{answers[q.id] === null ? "" : " ✓"}</Button>)}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[11px] leading-[1.8] text-mist">{storageAvailable ? "进度已保存在此浏览器，可以稍后继续。" : "请保持本页打开，完成后提交保存结果。"}</p>
            <Button variant="link" className="min-h-11" disabled={submitting} onClick={() => setRestartOpen(true)}>重新开始</Button>
          </div>

          <nav aria-label="题目导航" className="mt-[33px] hidden items-center justify-between gap-[30px] md:flex">
            <Button variant="back" disabled={index === 0} onClick={back} className="text-[13px]">
              <ArrowLeft size={17} />
              上一题
            </Button>
            <PrimaryButton disabled={current === null || submitting} onClick={next} className="min-h-[52px] w-[180px] min-w-0 shrink">
              {nextLabel}
            </PrimaryButton>
          </nav>
        </section>
      </main>

      <Dock>
        <nav aria-label="底部题目导航" className="flex items-center justify-between gap-[30px]">
          <Button variant="back" disabled={index === 0} onClick={back} className="min-w-[75px] gap-2 text-[11px]">
            <ArrowLeft size={17} />
            上一题
          </Button>
          <PrimaryButton disabled={current === null || submitting} onClick={next} className="min-h-[52px] min-w-0 max-w-[190px] flex-1 shrink">
            {mobileNextLabel}
          </PrimaryButton>
        </nav>
      </Dock>
      <ResponsiveSheet open={restartOpen} onOpenChange={setRestartOpen} title="重新开始本版本？" description="只清空当前版本未提交的答案；其他版本进度和已完成报告都会保留。">
        <PrimaryButton className="mt-6" onClick={() => { writeQuizProgress(emptyProgress(questionnaire.id)); setRestartOpen(false); }}>确认重新开始</PrimaryButton>
        <Button variant="link" className="mt-3 min-h-11" onClick={() => setRestartOpen(false)}>保留当前进度</Button>
      </ResponsiveSheet>
    </>
  );
}
