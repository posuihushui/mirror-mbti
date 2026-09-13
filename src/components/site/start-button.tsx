"use client";

import { PrimaryButton } from "@/components/site/primary-button";
import { useQuizProgress } from "@/lib/client-storage";

/** Home CTA exposes the active version's saved progress. */
export function StartButton({ className }: { className?: string }) {
  const progress = useQuizProgress();
  const answered = progress ? Object.values(progress.answers).filter((a) => a !== null).length : 0;
  return (
    <PrimaryButton href="/quiz" className={className}>
      {progress && answered > 0 ? `继续测试 · ${answered}/${progress.questionOrder.length} 题` : "开始人格测试"}
    </PrimaryButton>
  );
}
