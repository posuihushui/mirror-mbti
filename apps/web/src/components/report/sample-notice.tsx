import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import type { Profile } from "@/lib/personality";
import { chapterLabelsFor } from "@/lib/site";
import { RelationshipCards } from "@/components/pairing/relationship-cards";
import { ChapterJump } from "./chapter-ui";
import { PairLines, PairMarks } from "@/components/pairing/pair-figures";
import { categoriesOf, GuideSteps } from "./report-invite";

/**
 * Marks the sample report as a sample, right above the reading: it says the report is written from
 * the scores, lists what each chapter holds (each entry opens its chapter) and offers the test.
 * It never promises the reader a full report of their own.
 */
export async function SampleNotice() {
  const locale = await getLocale();
  const t = resultMessages[locale].sampleNotice;
  return (
    <div className="border-b border-line px-6 pt-5 pb-5 md:px-0 md:pt-0 md:pb-6">
      <div className="md:flex md:items-end md:justify-between md:gap-10">
        <div>
          <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
          <p className="mt-2 max-w-[560px] text-sm text-mist">
            {t.body}
          </p>
        </div>
        {/* Phones have the same action in the dock. */}
        <div className="hidden shrink-0 md:block">
          <TextLink href={href(locale, "/quiz")} className="font-medium whitespace-nowrap" {...trackAttrs("start_quiz", "sample_notice")}>
            {t.start}
          </TextLink>
        </div>
      </div>
      <ol aria-label={t.contentsLabel} className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:grid-cols-4 md:gap-3">
        {chapterLabelsFor(locale).map((label, i) => (
          <li key={label}>
            <ChapterJump index={i} className="flex h-full w-full flex-col items-start gap-1 bg-card p-3 text-left md:p-4">
              <span className="text-xs text-mist"><span className="mr-1.5 text-warm-ink">0{i + 1}</span>{label}</span>
              <span className="text-sm font-medium break-keep text-balance">{t.contents[i]}</span>
            </ChapterJump>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The sample's guide-for-two tab: how a guide comes about, the sample reader's half on the guide's
 * four lines, and the same difference in the four relationships. Value only: no price, no invitation
 * and nothing to buy; the way in is the test.
 */
export async function SampleGuide({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const ui = pairingUiMessages[locale];
  const t = ui.reportInvite;
  const m = pairingMessages[locale];
  return (
    <div data-sample-guide className="space-y-10 md:space-y-12">
      <section aria-label={t.eyebrow} className="border-y border-line py-6">
        <GuideSteps steps={ui.publicSteps} reached={0} locale={locale} kind="public" />
      </section>
      <section aria-labelledby="sample-halves" className="bg-card p-5 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 id="sample-halves" className="text-xl">{t.halvesTitle}</h3>
          <PairMarks you={profile} partner={null} labels={[`${t.you} · ${profile.type}`, t.them]} size={44} />
        </div>
        <div className="mt-6"><PairLines locale={locale} you={categoriesOf(profile)} them={null} /></div>
      </section>
      <section aria-labelledby="sample-relationships">
        <h3 id="sample-relationships" className="text-xl">{m.relationshipsTitle}</h3>
        <p className="mt-3 text-sm text-mist">{m.relationshipsIntro}</p>
        <div className="mt-5"><RelationshipCards locale={locale} compact /></div>
      </section>
      <TextLink href={href(locale, "/pairing")} className="font-medium" {...trackAttrs("pairing_info", "pairing_benefit")}>
        {ui.learn}
      </TextLink>
    </div>
  );
}
