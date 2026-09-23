import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";

type Props = {
  /** Optional secondary link, e.g. from the sample result page into the sample report. `href` is already localized. */
  secondary?: { href: string; label: string };
};

/**
 * Closing block of the public sample. Everything here is already free to read, so the
 * invitation is to take the test; the price is not quoted here at all (owner decision, 2026-09-17).
 */
export async function SampleCta({ secondary }: Props) {
  const locale = await getLocale();
  const t = resultMessages[locale].sampleCta;

  return (
    <section className="mx-4 block bg-night-deep px-6 py-8 text-paper md:mx-0 md:grid md:grid-cols-2 md:items-center md:gap-12 md:p-10 xl:gap-20 xl:px-14 xl:py-14">
      <div>
        <p className="eyebrow text-night-mist">{t.eyebrow}</p>
        <h2 className="mt-5 text-3xl leading-heading md:text-4xl">{t.heading}</h2>
        <p className="mt-5 text-sm text-night-body">
          {t.body}
        </p>
      </div>
      <div className="mt-8 md:mt-0">
        <div className="flex items-center gap-4 xl:gap-6">
          {t.meta.map(([value, label], i) => (
            <span
              key={label}
              className={
                "flex items-baseline gap-1.5 text-lg font-medium whitespace-nowrap md:text-xl" +
                (i > 0 ? " border-l border-night-line pl-4 xl:pl-6" : "")
              }
            >
              {value} <small className="text-xs font-normal text-night-mist">{label}</small>
            </span>
          ))}
        </div>
        <div className="mt-8 hidden md:block md:max-w-sm">
          <PrimaryButton href={href(locale, "/quiz")} light {...trackAttrs("start_quiz", "sample_cta")}>
            {t.start}
          </PrimaryButton>
        </div>
        {secondary && (
          <TextLink href={secondary.href} className="mt-4 text-night-body hover:text-paper" {...trackAttrs("read_sample_report", "sample_cta")}>
            {secondary.label}
          </TextLink>
        )}
        <p className="mt-4 text-xs text-night-mist">
          {t.footnote}
        </p>
      </div>
    </section>
  );
}
