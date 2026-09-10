"use client";

import { PrimaryButton } from "@/components/site/primary-button";
import { useHasQuizProgress } from "@/lib/client-storage";

/** Home CTA: "继续认识自己" once local answers exist, otherwise "开始认识自己". */
export function StartButton({ className }: { className?: string }) {
  const inProgress = useHasQuizProgress();
  return (
    <PrimaryButton href="/quiz" className={className}>
      {inProgress ? "继续认识自己" : "开始认识自己"}
    </PrimaryButton>
  );
}
