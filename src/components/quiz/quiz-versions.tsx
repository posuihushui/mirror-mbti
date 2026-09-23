"use client";
import { recordShareQuizStarted } from "@/components/share/share-visit";
import { SurfaceMark } from "@/components/brand/surface-mark";

import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { track } from "@/lib/analytics/track";
import { useQuizDrafts, writeQuizProgress } from "@/lib/client-storage";
import { useLocale } from "@/lib/i18n/locale-provider";
import { quizMessages } from "@/lib/i18n/messages/quiz";
import { emptyProgress } from "@/lib/quiz-progress";
import { questionnairesFor } from "@/lib/questionnaires";

export function QuizVersions({ onChoose }: { onChoose: () => void }) {
  const { drafts } = useQuizDrafts();
  const locale = useLocale();
  const t = quizMessages[locale].versions;
  return (
    <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-[18px] text-[27px] leading-[1.6] md:text-[38px]">{t.heading}</h1>
      <p className="mt-4 max-w-[650px] text-[13px] leading-[2] text-mist">{t.intro}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {questionnairesFor(locale).map((q, index) => {
          const draft = drafts[q.id];
          const answered = draft ? Object.values(draft.answers).filter((a) => a !== null).length : 0;
          return (
            <section key={q.id} data-version-index={index} className="overflow-hidden border border-line bg-card" aria-label={t.sectionLabel(q.count, q.name)}>
              <div className="surface-texture surface-texture-dark relative overflow-hidden bg-night p-6 text-paper">
                <SurfaceMark className="-right-28 -bottom-24 w-64 opacity-[0.06]" />
                <div className="surface-content quiz-version-motion flex items-center justify-between gap-4">
                  <h2 className="text-2xl">{t.title(q.count, q.name)}</h2>
                  <Badge className="border-night-line bg-white/5 text-paper">{q.count === 64 ? t.badgeMore : t.badgeQuick}</Badge>
                </div>
              </div>
              <div className="flex min-h-64 flex-col gap-5 p-6">
                <p className="quiz-version-motion text-xs text-mist">{t.meta(q.duration, q.count / 4)}</p>
                <p className="quiz-version-motion text-[13px] leading-8 text-mist">{q.description}</p>
                {answered > 0 && <p className="quiz-version-motion text-xs">{t.saved(answered, q.count)}</p>}
                <PrimaryButton className="mt-auto" onClick={() => { void recordShareQuizStarted(); track("quiz_start", { questionnaire_id: q.id, question_count: q.count, resumed: answered > 0, answered_count: answered }); writeQuizProgress(draft ?? emptyProgress(q.id)); onChoose(); }}>
                  {answered > 0 ? t.resume(q.count, q.name) : t.start(q.count, q.name)}
                </PrimaryButton>
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-[12px] leading-[2] text-mist">{t.footnote}</p>
    </main>
  );
}
