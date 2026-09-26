import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { chapterLabelsFor } from "@/lib/site";
import { ChapterJump } from "./chapter-ui";

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

/** Chapter 03's pointer to the guide for two, where a real report invites someone. Value only: no price, no invitation. */
export async function SamplePairing() {
  const locale = await getLocale();
  const m = pairingMessages[locale];
  return (
    <section className="my-4 flex flex-col gap-1 border-y border-line py-3 md:flex-row md:items-center md:justify-between md:gap-8">
      <p className="text-sm"><span className="font-medium">{m.title}</span><span className="text-mist"> · {m.summary}</span></p>
      <TextLink href={href(locale, "/pairing")} className="shrink-0 text-mist hover:text-ink" {...trackAttrs("pairing_info", "pairing_benefit")}>
        {pairingUiMessages[locale].learn}
      </TextLink>
    </section>
  );
}
