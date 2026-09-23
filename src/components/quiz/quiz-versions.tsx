"use client";
import { ArrowRight } from "@phosphor-icons/react";
import { recordShareQuizStarted } from "@/components/share/share-visit";
import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { useQuizDrafts, writeQuizProgress } from "@/lib/client-storage";
import { useLocale } from "@/lib/i18n/locale-provider";
import { quizMessages } from "@/lib/i18n/messages/quiz";
import { emptyProgress } from "@/lib/quiz-progress";
import { questionnairesFor } from "@/lib/questionnaires";

/**
 * The version choice, weighted: the quick version is the default and gets the one primary button;
 * the standard version is a quieter second option. Each keeps its own saved draft.
 */
export function QuizVersions({ onChoose }: { onChoose: () => void }) {
  const { drafts } = useQuizDrafts();
  const locale = useLocale();
  const t = quizMessages[locale].versions;
  const [quick, ...others] = questionnairesFor(locale);
  const begin = (q: typeof quick) => {
    const draft = drafts[q.id];
    const answered = draft ? Object.values(draft.answers).filter((a) => a !== null).length : 0;
    void recordShareQuizStarted();
    track("quiz_start", { questionnaire_id: q.id, question_count: q.count, resumed: answered > 0, answered_count: answered });
    writeQuizProgress(draft ?? emptyProgress(q.id));
    onChoose();
  };
  const answeredFor = (q: typeof quick) => {
    const draft = drafts[q.id];
    return draft ? Object.values(draft.answers).filter((a) => a !== null).length : 0;
  };
  const quickAnswered = answeredFor(quick);
  return (
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{t.heading}</h1>
      <p className="mt-4 max-w-xl text-sm text-mist md:text-base">{t.intro}</p>

      <section data-version-index={0} className="mt-8 border border-line bg-card p-6 md:p-8" aria-label={t.sectionLabel(quick.count, quick.name)}>
        <div className="quiz-version-motion">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl">{t.title(quick.count, quick.name)}</h2>
            <Badge>{t.badgeQuick}</Badge>
          </div>
          <p className="mt-2 text-sm text-mist">{t.meta(quick.duration, quick.count / 4)}</p>
          <p className="mt-4 text-base">{quick.description}</p>
          {quickAnswered > 0 && <p className="mt-2 text-sm text-warm-ink">{t.saved(quickAnswered, quick.count)}</p>}
        </div>
        {/* The call to action stays outside the animated copy. */}
        <PrimaryButton className="mt-6 md:max-w-xs" onClick={() => begin(quick)}>
          {quickAnswered > 0 ? t.resume(quick.count, quick.name) : t.start(quick.count, quick.name)}
        </PrimaryButton>
      </section>

      {others.map((q, index) => {
        const answered = answeredFor(q);
        return (
          <section key={q.id} data-version-index={index + 1} className="mt-2 flex flex-col gap-2 border-b border-line px-1 py-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-2" aria-label={t.sectionLabel(q.count, q.name)}>
            <div className="quiz-version-motion min-w-0">
              <h2 className="text-lg font-medium">{t.title(q.count, q.name)}</h2>
              <p className="mt-1 text-sm text-mist">{t.meta(q.duration, q.count / 4)} · {q.description}</p>
              {answered > 0 && <p className="mt-1 text-sm text-warm-ink">{t.saved(answered, q.count)}</p>}
            </div>
            <Button variant="link" className="shrink-0 font-medium" onClick={() => begin(q)}>
              {answered > 0 ? t.resume(q.count, q.name) : t.start(q.count, q.name)}
              <ArrowRight size={15} aria-hidden />
            </Button>
          </section>
        );
      })}
      <p className="mt-6 max-w-xl text-xs text-mist">{t.footnote}</p>
    </main>
  );
}
