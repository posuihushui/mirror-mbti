"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { useQuizDrafts, writeQuizProgress } from "@/lib/client-storage";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { quizMessages } from "@/lib/i18n/messages/quiz";
import { emptyProgress } from "@/lib/quiz-progress";
import { questionnairesFor } from "@/lib/questionnaires";

export function QuizVersions({ onChoose, priceLabel }: { onChoose: () => void; priceLabel: string }) {
  const { drafts } = useQuizDrafts();
  const locale = useLocale();
  const t = quizMessages[locale].versions;
  return (
    <main className="mx-auto max-w-[1000px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-[18px] text-[27px] leading-[1.6] md:text-[38px]">{t.heading}</h1>
      <p className="mt-4 max-w-[650px] text-[13px] leading-[2] text-mist">{t.intro}</p>
      <div className="mt-8 grid gap-7 md:grid-cols-2">
        {questionnairesFor(locale).map((q, index) => {
          const draft = drafts[q.id];
          const answered = draft ? Object.values(draft.answers).filter((a) => a !== null).length : 0;
          return (
            <section key={q.id} data-version-index={index} className="flex flex-col gap-5 border-t border-line pt-6" aria-label={t.sectionLabel(q.count, q.name)}>
              <div className="quiz-version-motion flex items-center justify-between">
                <h2 className="text-[23px]">{t.title(q.count, q.name)}</h2>
                <Badge>{q.count === 64 ? t.badgeMore : t.badgeQuick}</Badge>
              </div>
              <p className="quiz-version-motion text-[12px] text-mist">{t.meta(q.duration, q.count / 4)}</p>
              <p className="quiz-version-motion min-h-12 text-[13px] leading-[2] text-mist">{q.description}</p>
              {answered > 0 && <p className="quiz-version-motion text-[12px]">{t.saved(answered, q.count)}</p>}
              <PrimaryButton onClick={() => { writeQuizProgress(draft ?? emptyProgress(q.id)); onChoose(); }}>
                {answered > 0 ? t.resume(q.count, q.name) : t.start(q.count, q.name)}
              </PrimaryButton>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-[12px] leading-[2] text-mist">{t.footnote(priceLabel)}</p>
      <nav aria-label={t.navLabel} className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[12px]">
        <Link href={href(locale, "/about")} className="text-link">{t.about}</Link><Link href={href(locale, "/preferences")} className="text-link">{t.preferences}</Link><Link href={href(locale, "/help")} className="text-link">{t.help}</Link>
      </nav>
    </main>
  );
}
