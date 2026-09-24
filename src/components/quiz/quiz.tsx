"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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
import type { MirrorProfile } from "@/components/brand/mirror-mark";
import { ResultReveal, revealAllowed } from "@/components/quiz/result-reveal";

type CreateResultResponse = { ok: true; data: { id: string; type: string; values: number[] } } | { ok: false; error: { code: string; message: string } };

/** Long enough to see the choice confirm (160ms) before the next question slides in. */
const ADVANCE_MS = 280;
/** The 64-item version is read in four parts of 16, with a short pause between them. */
const PART_SIZE = 16;
/** A rough reading pace for the time left at a pause; the version picker's estimates are ~8s per item. */
const SECONDS_PER_ITEM = 8.5;

/** The questionnaire island: answers and position persist in localStorage; scoring happens on the server. */
export function Quiz() {
  const progress = useQuizProgress();
  const locale = useLocale();
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [previousCount, setPreviousCount] = useState<number>();
  // Held here, above the runner: the draft is cleared on submission, which would otherwise swap in the version picker.
  const [reveal, setReveal] = useState<{ profile: MirrorProfile; target: string } | null>(null);
  if (reveal) return <ResultReveal profile={reveal.profile} onDone={() => router.push(reveal.target)} />;
  // A draft from the other language's questionnaire is kept, but this page starts from its own versions.
  const own = progress && getQuestionnaire(progress.questionnaireId)?.locale === locale ? progress : null;
  if (!own || choosing) return <QuizVersions onChoose={() => setChoosing(false)} />;
  return <QuizRunner key={own.questionnaireId} progress={own} previousCount={previousCount} onReveal={setReveal} onChoose={() => { setPreviousCount(getQuestionnaire(own.questionnaireId)!.count); setChoosing(true); }} />;
}

function QuizRunner({ progress, onChoose, onReveal, previousCount }: { progress: QuizProgress; onChoose: () => void; onReveal: (reveal: { profile: MirrorProfile; target: string }) => void; previousCount?: number }) {
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
  /** The part just completed while its pause is showing (64 items only); never persisted, so a reload resumes on the next question. */
  const [pause, setPause] = useState<number | null>(null);
  const quiz = { questionnaire_id: questionnaire.id, question_count: count };
  const parts = count > 32 ? Math.ceil(count / PART_SIZE) : 1;
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
    const target = pause !== null
      ? document.querySelector<HTMLButtonElement>("[data-quiz-continue]:not([hidden])")
      : choices.current?.querySelector<HTMLButtonElement>("button");
    target?.focus({ preventScroll: true });
  }, [index, pause]);

  const save = (patch: Partial<Pick<QuizProgress, "answers" | "index">>) => {
    writeQuizProgress({ ...progress, ...patch });
  };

  const cancelAdvance = () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  };

  const goTo = (nextIndex: number) => {
    cancelAdvance();
    setPause(null);
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
      // Finishing a part of the long version pauses before the next one instead of running straight on.
      if (parts > 1 && (from + 1) % PART_SIZE === 0) {
        const done = (from + 1) / PART_SIZE;
        setPause(done);
        track("quiz_part_complete", { ...quiz, part_number: done });
      }
    }, ADVANCE_MS);
  };

  const resume = () => {
    setDirection("forward");
    setPause(null);
  };

  const back = () => {
    if (index > 0) goTo(index - 1);
  };

  const next = async () => {
    if (pause !== null) return resume();
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
      const reveal = revealAllowed();
      const compare = new URLSearchParams(window.location.search).get("compare");
      const continuation = compare && /^[A-Za-z0-9_-]{32}$/.test(compare) ? `?compare=${compare}` : "";
      if (continuation) {
        // Keep source outside answers/drafts. A failed intent save never turns a valid result into a failed submission.
        await fetch("/api/comparison-continuations", { method: "POST", headers: { "content-type": "application/json", "X-Mirror-Locale": locale },
          body: JSON.stringify({ invitationToken: compare, resultId: json.data.id }), signal: AbortSignal.timeout(4000) }).catch(() => undefined);
      }
      const target = href(locale, `/result/${json.data.id}${continuation}`);
      // The reveal plays while the result page loads; without motion the page opens straight away.
      if (reveal) {
        router.prefetch(target);
        onReveal({ profile: { type: json.data.type, values: json.data.values }, target });
      } else router.push(target);
      writeQuizProgress(null);
    } catch (e) {
      track("quiz_submit_error", { ...quiz, error_code: (e as { code?: string }).code ?? (e instanceof Error ? e.name : "UNKNOWN") });
      toast(e instanceof Error ? e.message : t.submitFailed);
      setSubmitting(false);
    }
  };

  const nextLabel = pause !== null ? t.partContinue(pause + 1) : submitting ? t.submitting : last ? t.viewResult : t.next;
  const mobileNextLabel = pause !== null ? t.partContinue(pause + 1) : submitting ? t.mobileSubmitting : last ? t.mobileViewResult : t.next;
  const nextDisabled = pause === null && (current === null || submitting);
  const remainingMinutes = Math.max(1, Math.round(((count - answered) * SECONDS_PER_ITEM) / 60));

  // Keyboard answering: 1–5 choose, ← → move, Enter continues from a pause. Fields and dialogs keep their keys.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || submitting) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest("input, textarea, select, [contenteditable='true']") || document.querySelector("[role='dialog']")) return;
    const choice = /^[1-5]$/.test(event.key) ? Number(event.key) - 1 : -1;
    if (choice >= 0 && pause === null) {
      event.preventDefault();
      focusChoices.current = true;
      select(choicesFor(locale)[choice].v);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
    } else if (event.key === "ArrowRight" && (pause !== null || (current !== null && !last))) {
      event.preventDefault();
      void next();
    } else if (event.key === "Enter" && pause !== null && !target?.closest("button, a")) {
      event.preventDefault();
      void next();
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          <p className="mt-6 hidden text-xs text-mist [@media(hover:hover)_and_(pointer:fine)]:block">{t.keyboardHint}</p>
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
              {parts > 1 && <small className="ml-2 text-xs font-normal text-mist">· {t.part(Math.min(Math.floor(index / PART_SIZE) + 1, parts), parts)}</small>}
            </span>
            <span><NumberTextMotion>{t.answered(answered, count)}</NumberTextMotion></span>
          </div>
          <div className="relative mt-3">
            <Progress value={answered} max={count} className="h-[2px]" indicatorClassName="quiz-progress-motion" aria-label={t.progressLabel} />
            {/* The long version's parts show as gaps in the bar. */}
            {Array.from({ length: parts - 1 }, (_, i) => (
              <span key={i} aria-hidden className="absolute -top-px h-1 w-1 bg-paper" style={{ left: `calc(${((i + 1) * 100) / parts}% - 2px)` }} />
            ))}
          </div>

          {pause !== null ? (
            <div className="quiz-question-motion" data-direction="forward" key={`pause-${pause}`} aria-live="polite">
              <p className="eyebrow mt-7 text-warm-ink md:mt-10">{t.partDoneEyebrow(pause, parts)}</p>
              <h2 className="mt-4 text-2xl md:text-[27px]">{t.partDoneHeading}</h2>
              <p className="mt-4 text-base text-slate">{t.partDoneBody(answered, count, remainingMinutes)}</p>
              <ol aria-hidden className="mt-7 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${parts}, minmax(0, 1fr))` }}>
                {Array.from({ length: parts }, (_, i) => (
                  <li key={i} className={cn("h-1.5 rounded-full", i < pause ? "bg-warm" : "bg-line")} />
                ))}
              </ol>
            </div>
          ) : (
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
          )}
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
            <PrimaryButton disabled={nextDisabled} onClick={next} data-quiz-continue={pause !== null ? "" : undefined} className="min-h-[52px] w-[210px] min-w-0 shrink">
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
          <PrimaryButton disabled={nextDisabled} onClick={next} className="min-h-[52px] min-w-0 max-w-[210px] flex-1 shrink">
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
