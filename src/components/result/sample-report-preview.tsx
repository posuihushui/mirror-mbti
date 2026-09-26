import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { reportMessages } from "@/lib/i18n/messages/report";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import type { Profile } from "@/lib/personality";
import { reportHighlights } from "@/lib/report-content";
import { SAMPLE_RESULT_ID } from "@/lib/results";
import { chapterLabelsFor } from "@/lib/site";

const sampleReport = `/report/${SAMPLE_RESULT_ID}`;

/**
 * The sample result's look inside the sample report, where a real result has its unlock panel.
 * Each chapter is represented by a passage quoted from it (a step to try, a blind spot, a line to say,
 * a day of practice) and opens that chapter. Nothing here is for sale, so nothing names a price.
 */
export async function SampleReportPreview({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const t = resultMessages[locale].samplePreview;
  const report = reportMessages[locale];
  const labels = chapterLabelsFor(locale);
  const kickers = [report.one.growthLabel, report.nav.blindspots, t.say, t.week];
  const read = (
    <TextLink href={href(locale, sampleReport)} className="font-medium" {...trackAttrs("read_sample_report", "sample_preview")}>
      {pageMessages[locale].result.readSample}
    </TextLink>
  );
  return (
    <section aria-labelledby="sample-report-heading" className="mx-6 mb-10 border-t border-line pt-8 md:mx-0 md:mb-12 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 md:pt-10">
      <div>
        <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
        <h2 id="sample-report-heading" className="mt-3 text-3xl whitespace-pre-line">{t.heading}</h2>
        <p className="mt-4 text-sm text-mist">{t.sub}</p>
        <div className="mt-6 hidden md:block">{read}</div>
      </div>
      <ol className="mt-6 grid gap-3 md:mt-0 md:grid-cols-2">
        {reportHighlights(profile, locale).map((item) => (
          <li key={item.chapter}>
            <Link
              href={href(locale, item.chapter ? `${sampleReport}?chapter=${item.chapter + 1}` : sampleReport)}
              className="group flex h-full flex-col bg-card p-5 md:p-6"
              {...trackAttrs("read_sample_report", "sample_preview")}
            >
              <span className="flex items-center justify-between gap-3 text-xs text-mist">
                <span><span className="mr-2 text-warm-ink">0{item.chapter + 1}</span>{labels[item.chapter]}</span>
                <ArrowRight size={15} aria-hidden className="shrink-0 text-ink transition-transform motion-safe:group-hover:translate-x-0.5" />
              </span>
              <span className="mt-5 block text-xs text-warm-ink">{item.both ? report.one.bothLabel : kickers[item.chapter]}</span>
              <span className="mt-1 block text-base font-medium">{item.title}</span>
              {item.say ? (
                <span className="mt-3 block rounded-[16px] rounded-bl-[4px] border border-line bg-paper px-4 py-3 text-base text-ink">“{item.say}”</span>
              ) : (
                <span className="mt-2 block text-sm whitespace-pre-line text-slate">{item.body}</span>
              )}
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-5 md:hidden">{read}</div>
    </section>
  );
}

/** Desktop only, where a real result has its report bar: the sample report, and the test itself. */
export async function SampleReportBar() {
  const locale = await getLocale();
  const t = resultMessages[locale];
  return (
    <section className="mb-12 hidden items-center justify-between gap-8 border border-line bg-card px-8 py-5 md:flex">
      <div className="min-w-0">
        <p className="text-base font-medium">{t.sampleBar.title}</p>
        <p className="mt-1 text-sm text-mist">{t.sampleBar.sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-6">
        <TextLink href={href(locale, sampleReport)} className="font-medium" {...trackAttrs("read_sample_report", "sample_bar")}>{t.sampleBar.read}</TextLink>
        <div className="w-60">
          <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "sample_bar")}>{t.sampleCta.start}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

/** Phones: the test, with the sample report beside it where a real result names its report and price. */
export async function SampleDock() {
  const locale = await getLocale();
  const t = resultMessages[locale];
  return (
    <Dock>
      <div className="flex w-full min-w-0 items-center gap-3">
        <Link href={href(locale, sampleReport)} className="min-w-[88px] shrink-0" {...trackAttrs("read_sample_report", "dock")}>
          <small className="block text-xs text-mist">{t.sampleDock.label}</small>
          <span className="mt-0.5 flex items-center gap-1 text-sm font-medium">
            {t.sampleDock.read}
            <ArrowRight size={14} aria-hidden />
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <PrimaryButton href={href(locale, "/quiz")} className="min-h-[52px] px-5 text-sm" {...trackAttrs("start_quiz", "dock")}>{pageMessages[locale].result.start}</PrimaryButton>
        </div>
      </div>
    </Dock>
  );
}
