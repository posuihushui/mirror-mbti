"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { writeQuizProgress } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getQuestionnaire, type QuestionnaireId, type ResponseItem } from "@/lib/questionnaires";
import { emptyProgress } from "@/lib/quiz-progress";

export function ReviewAnswers({ resultId }: { resultId: string }) {
  const locale = useLocale();
  const t = siteMessages[locale].reviewAnswers;
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const review = async () => {
    setPending(true);
    try {
      const response = await fetch(`/api/results/${resultId}/answers`, { cache: "no-store" });
      const json = await response.json() as { ok: boolean; data?: { questionnaireId: QuestionnaireId; responses: ResponseItem[] }; error?: { message: string } };
      if (!json.ok || !json.data || !getQuestionnaire(json.data.questionnaireId)) throw new Error(json.error?.message ?? t.readFailed);
      const { questionnaireId, responses } = json.data;
      writeQuizProgress({ ...emptyProgress(questionnaireId), answers: Object.fromEntries(responses.map((r) => [r.questionId, r.value])) });
      track("result_answers_review", { outcome: "loaded" });
      router.push(href(locale, "/quiz"));
    } catch (error) { track("result_answers_review", { outcome: "failed" }); toast(error instanceof Error ? error.message : t.readFailed); setPending(false); }
  };
  return <div className="max-w-[560px]">
    <p className="mb-4 text-[12px] leading-[2] text-mist">{t.note}</p>
    <PrimaryButton disabled={pending} onClick={review} {...trackAttrs("review_answers", "unclear_result")}>{pending ? t.pending : t.action}</PrimaryButton>
  </div>;
}
