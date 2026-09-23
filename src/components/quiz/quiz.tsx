"use client";

import { useEffect, useRef, useState } from "react";
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
import { progressMilestone } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { readQuizProgress, useQuizProgress, useStorageAvailable, writeLastResultId, writeQuizProgress, type QuizProgress } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { quizMessages } from "@/lib/i18n/messages/quiz";
import { getQuestionnaire } from "@/lib/questionnaires";
import { emptyProgress } from "@/lib/quiz-progress";
import { choicesFor } from "@/lib/site";
import { NumberMotion, NumberTextMotion } from "@/components/site/number-motion";

type CreateResultResponse = { ok: true; data: { id: string } } | { ok: false; error: { code: string; message: string } };

/** Long enough to see the choice confirm (160ms) before the next question slides in. */
const ADVANCE_MS = 280;

/** The questionnaire island: answers and position persist in localStorage; scoring happens on the server. */
export function Quiz() {
  const progress = useQuizProgress();
  const locale = useLocale();
  const [choosing, setChoosing] = useState(false);
  const [previousCount, setPreviousCount] = useState<number>();
  // A draft from the other language's questionnaire is kept, but this page starts from its own versions.
  const own = progress && getQuestionnaire(progress.questionnaireId)?.locale === locale ? progress : null;
  if (!own || choosing) return <QuizVersions onChoose={() => setChoosing(false)} />;
  return <QuizRunner key={own.questionnaireId} progress={own} previousCount={previousCount} onChoose={() => { setPreviousCount(getQuestionnaire(own.questionnaireId)!.count); setChoosing(true); }} />;
}

function QuizRunner({ progress, onChoose, previousCount }: { progress: QuizProgress; onChoose: () => void; previousCount?: number }) {
  const router = useRouter();
  const locale = useLocale();
  const t = quizMessages[locale].runner;
  const questionnaire = getQuestionnaire(progress.questionnaireId)!;
  const questions = questionnaire.questions;
  const count = questionnaire.count;
  const { answers, index } = progress;
  const storageAvailable = useStorageAvailable();
  const [submitting, setSubmitting] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const quiz = { questionnaire_id: questionnaire.id, question_count: count };
  const advanceTimer = useRef<number | null>(null);
  // Keyboard users keep their place in the answers when a choice moves them on.
  const focusChoices = useRef(false);
  const choices = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storageAvailable) track("quiz_storage_unavailable", { questionnaire_id: questionnaire.id, question_count: count });
  }, [storageAvailable, questionnaire.id, count]);

  useEffect(() => () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); }, []);

  useEffect(() => {
    if (!focusChoices.current) return;
    focusChoices.current = false;
    choices.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [index]);

  const save = (patch: Partial<Pick<QuizProgress, "answers" | "index">>) => {
    writeQuizProgress({ ...progress, ...patch });
  };

  const cancelAdvance = () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  };

  const goTo = (nextIndex: number) => {
    cancelAdvance();
    if (nextIndex === index) return;
    setDirection(nextIndex > index ? "forward" : "backward");
    save({ index: nextIndex });
  };

  const answered = Object.values(answers).filter((a) => a !== null).length;
  const current = answers[questions[index].id];
  const last = index === count - 1;

  /**
   * An answer moves on by itself after a short confirmation; the last one never submits by itself,
   * so the result is always one deliberate tap away. The latest saved draft is re-read when the timer
   * fires, so the answer just chosen is never overwritten by the move.
   */
  const select = (v: number) => {
    save({ answers: { ...answers, [questions[index].id]: v } });
    const nextAnswered = current === null ? answered + 1 : answered;
    const milestone = progressMilestone(answered, nextAnswered, count);
    if (milestone) track("quiz_progress", { ...quiz, progress_percent: milestone, answered_count: nextAnswered });
    cancelAdvance();
    if (last) return;
    const from = index;
    focusChoices.current = choices.current?.contains(document.activeElement) ?? false;
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      const latest = readQuizProgress(questionnaire.id);
      if (!latest || latest.index !== from) return;
      setDirection("forward");
      writeQuizProgress({ ...latest, index: from + 1 });
    }, ADVANCE_MS);
  };

  const back = () => {
    if (index > 0) goTo(index - 1);
  };

  const next = async () => {
    if (current === null || submitting) return;
    if (!last) {
      goTo(index + 1);
      return;
    }
    const missing = questions.findIndex((q) => answers[q.id] === null);
    if (missing >= 0) { track("quiz_incomplete", { ...quiz, question_number: missing + 1 }); goTo(missing); toast(t.incomplete); return; }
    setSubmitting(true);
    track("quiz_submit", quiz);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionnaireId: questionnaire.id, answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] })) }),
      });
      const json = (await res.json()) as CreateResultResponse;
      if (!json.ok) throw Object.assign(new Error(json.error.message), { code: json.error.code });
      track("quiz_complete", quiz);
      writeLastResultId(json.data.id);
      writeQuizProgress(null);
      const compare = new URLSearchParams(window.location.search).get("compare");
      const continuation = compare && /^[A-Za-z0-9_-]{32}$/.test(compare) ? `?compare=${compare}` : "";
      if (continuation) {
        // Keep source outside answers/drafts. A failed intent save never turns a valid result into a failed submission.
        await fetch("/api/comparison-continuations", { method: "POST", headers: { "content-type": "application/json", "X-Mirror-Locale": locale },
          body: JSON.stringify({ invitationToken: compare, resultId: json.data.id }), signal: AbortSignal.timeout(4000) }).catch(() => undefined);
      }
      router.push(href(locale, `/result/${json.data.id}${continuation}`));
    } catch (e) {
      track("quiz_submit_error", { ...quiz, error_code: (e as { code?: string }).code ?? (e instanceof Error ? e.name : "UNKNOWN") });
      toast(e instanceof Error ? e.message : t.submitFailed);
      setSubmitting(false);
    }
  };

  const nextLabel = submitting ? t.submitting : last ? t.viewResult : t.next;
  const mobileNextLabel = submitting ? t.mobileSubmitting : last ? t.mobileViewResult : t.next;

  return (
    <>
      <main className="block max-w-[510px] px-6 pt-3 pb-[135px] md:mx-auto md:grid md:max-w-[1140px] md:grid-cols-2 md:gap-[70px] md:px-10 md:pt-14 md:pb-14 xl:gap-[125px]">
        <aside className="hidden md:block md:pt-5">
          <p className="eyebrow text-mist">{t.asideEyebrow}</p>
          <h1 className="mt-8 text-5xl leading-heading">{t.asideHeading}</h1>
          <p className="mt-6 text-sm text-mist whitespace-pre-line">{t.asideText}</p>
          <div className="mt-16 flex items-baseline">
            <strong className="text-8xl font-normal tracking-tighter"><NumberMotion value={index + 1} digits={2} /></strong>
            <span className="pl-3 text-base text-mist"> / <NumberMotion value={count} initialFrom={previousCount} /></span>
          </div>
          <p className="mt-1 text-xs text-mist">{t.asideHint}</p>
        </aside>

        <section className="md:max-w-[460px]">
          <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-mist">
            <span><NumberTextMotion initialFrom={t.version(questionnaire.name, previousCount ?? count)}>{t.version(questionnaire.name, count)}</NumberTextMotion></span>
            <Button variant="link" onClick={() => { track("quiz_version_switch", { ...quiz, answered_count: answered }); onChoose(); }} disabled={submitting} className="text-xs text-mist hover:text-ink">{t.switchVersion}</Button>
          </div>
          {!storageAvailable && <Alert className="mb-4"><AlertTitle>{t.storageTitle}</AlertTitle><AlertDescription>{t.storageBody}</AlertDescription></Alert>}
          <div className="flex items-baseline justify-between text-xs text-mist">
            <span className="text-2xl font-semibold text-ink">
              <NumberMotion value={index + 1} digits={2} /> <small className="text-sm font-normal text-mist">/ <NumberMotion value={count} initialFrom={previousCount} /></small>
            </span>
            <span><NumberTextMotion>{t.answered(answered, count)}</NumberTextMotion></span>
          </div>
          <Progress value={answered} max={count} className="mt-3 h-[2px]" indicatorClassName="quiz-progress-motion" aria-label={t.progressLabel} />

          <div className="quiz-question-motion" data-direction={direction} key={index}>
            <p className="eyebrow mt-7 text-mist short:hidden md:mt-10">{t.eyebrow}</p>
            <h2 id="question-title" aria-live="polite" aria-atomic="true" className="mt-4 min-h-[2.9em] text-2xl short:mt-6 short:text-xl md:mt-5 md:text-[27px]">
              {questions[index].text}
            </h2>
            <div ref={choices} className="mt-5 flex flex-col gap-2 short:mt-4 short:gap-1.5 md:mt-7" role="group" aria-labelledby="question-title">
              {choicesFor(locale).map(({ v, l }) => {
                const selected = current === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => select(v)} disabled={submitting}
                    className={cn(
                      "quiz-choice-motion flex min-h-12 items-center justify-between rounded-[3px] border border-line px-4 text-left text-base transition-colors duration-150 short:min-h-11 md:px-5 md:text-sm",
                      "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#e3e9ea]",
                      selected && "border-ink bg-ink text-paper [@media(hover:hover)_and_(pointer:fine)]:hover:bg-ink",
                    )}
                  >
                    <span>{l}</span>
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border border-[#abb8bd]",
                        selected && "border-paper bg-paper text-ink",
                      )}
                    >
                      {selected && <Check size={15} className="quiz-check-motion" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-mist">{t.noWrong}</p>
          <Accordion type="single" collapsible className="mt-4" onValueChange={(value) => { if (value) track("quiz_review_open", { ...quiz, answered_count: answered }); }}>
            <AccordionItem value="answers"><AccordionTrigger aria-label={t.review(answered, count)}><span><NumberTextMotion>{t.review(answered, count)}</NumberTextMotion></span></AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-xs text-mist">{t.reviewHint}</p>
                <div className="grid grid-cols-6 gap-2 md:grid-cols-8">
                  {questions.map((q, i) => <Button key={q.id} disabled={submitting} onClick={() => { if (i !== index) track("quiz_review_jump", { ...quiz, question_number: i + 1 }); goTo(i); }} className="min-h-11 justify-center border border-line text-xs" aria-label={t.questionLabel(i + 1, answers[q.id] !== null)} aria-current={index === i ? "step" : undefined}>{i + 1}{answers[q.id] === null ? "" : " ✓"}</Button>)}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-xs text-mist">{storageAvailable ? t.saved : t.keepOpen}</p>
            <Button variant="link" className="shrink-0 text-sm" disabled={submitting} onClick={() => setRestartOpen(true)}>{t.restart}</Button>
          </div>

          <nav aria-label={t.navLabel} className="mt-8 hidden items-center justify-between gap-[30px] md:flex">
            <Button variant="back" disabled={index === 0} onClick={back}>
              <ArrowLeft size={17} />
              {t.back}
            </Button>
            <PrimaryButton disabled={current === null || submitting} onClick={next} className="min-h-[52px] w-[190px] min-w-0 shrink">
              {nextLabel}
            </PrimaryButton>
          </nav>
        </section>
      </main>

      <Dock>
        <nav aria-label={t.dockNavLabel} className="flex items-center justify-between gap-[30px]">
          <Button variant="back" disabled={index === 0} onClick={back} className="min-w-[80px] gap-2 text-sm">
            <ArrowLeft size={17} />
            {t.back}
          </Button>
          <PrimaryButton disabled={current === null || submitting} onClick={next} className="min-h-[52px] min-w-0 max-w-[190px] flex-1 shrink">
            {mobileNextLabel}
          </PrimaryButton>
        </nav>
      </Dock>
      <ResponsiveSheet open={restartOpen} onOpenChange={setRestartOpen} title={t.restartTitle} description={t.restartDescription}>
        <PrimaryButton className="mt-6" onClick={() => { track("quiz_restart", { ...quiz, answered_count: answered }); writeQuizProgress(emptyProgress(questionnaire.id)); setRestartOpen(false); }}>{t.restartConfirm}</PrimaryButton>
        <Button variant="link" className="mt-3 min-h-11" onClick={() => setRestartOpen(false)}>{t.restartKeep}</Button>
      </ResponsiveSheet>
    </>
  );
}
