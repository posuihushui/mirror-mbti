"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PrimaryButton } from "@/components/site/primary-button";
import { writeQuizProgress } from "@/lib/client-storage";
import { getQuestionnaire, type QuestionnaireId, type ResponseItem } from "@/lib/questionnaires";
import { emptyProgress } from "@/lib/quiz-progress";

export function ReviewAnswers({ resultId }: { resultId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const review = async () => {
    setPending(true);
    try {
      const response = await fetch(`/api/results/${resultId}/answers`, { cache: "no-store" });
      const json = await response.json() as { ok: boolean; data?: { questionnaireId: QuestionnaireId; responses: ResponseItem[] }; error?: { message: string } };
      if (!json.ok || !json.data || !getQuestionnaire(json.data.questionnaireId)) throw new Error(json.error?.message ?? "暂时无法读取答案。");
      const { questionnaireId, responses } = json.data;
      writeQuizProgress({ ...emptyProgress(questionnaireId), answers: Object.fromEntries(responses.map((r) => [r.questionId, r.value])) });
      router.push("/quiz");
    } catch (error) { toast(error instanceof Error ? error.message : "暂时无法读取答案。"); setPending(false); }
  };
  return <div className="max-w-[560px]">
    <p className="mb-4 text-[12px] leading-[2] text-mist">检查答案会替换本版本未完成的草稿；再次提交会生成新记录，原结果与已购报告保留。</p>
    <PrimaryButton disabled={pending} onClick={review}>{pending ? "正在读取答案…" : "检查答案并重新作答"}</PrimaryButton>
  </div>;
}
