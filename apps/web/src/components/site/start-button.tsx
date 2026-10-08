"use client";

import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs, type CtaLocation } from "@/lib/analytics/events";
import { useQuizProgress } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getQuestionnaire } from "@/lib/questionnaires";

/** Home CTA exposes the active version's saved progress, when that draft belongs to this language. */
export function StartButton({ className, trackLocation }: { className?: string; trackLocation: CtaLocation }) {
  const locale = useLocale();
  const t = siteMessages[locale].startButton;
  const progress = useQuizProgress();
  const own = progress && getQuestionnaire(progress.questionnaireId)?.locale === locale ? progress : null;
  const answered = own ? Object.values(own.answers).filter((a) => a !== null).length : 0;
  return (
    <PrimaryButton href={href(locale, "/quiz")} className={className} {...trackAttrs(answered > 0 ? "resume_quiz" : "start_quiz", trackLocation)}>
      {own && answered > 0 ? t.resume(answered, own.questionOrder.length) : t.start}
    </PrimaryButton>
  );
}
