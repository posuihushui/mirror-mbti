import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";

/** Marks the sample report as a sample, right above the reading, and offers the test. */
export async function SampleNotice() {
  const locale = await getLocale();
  const t = resultMessages[locale].sampleNotice;
  return (
    <div className="flex flex-col gap-2 border-b border-line px-6 pt-5 pb-4 md:flex-row md:items-end md:justify-between md:gap-10 md:px-0 md:pt-0 md:pb-6">
      <div>
        <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
        <p className="mt-2 max-w-[560px] text-sm text-mist">
          {t.body}
        </p>
      </div>
      <TextLink href={href(locale, "/quiz")} className="shrink-0 font-medium whitespace-nowrap" {...trackAttrs("start_quiz", "sample_notice")}>
        {t.start}
      </TextLink>
    </div>
  );
}
