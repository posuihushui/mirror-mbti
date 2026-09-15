import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { PrimaryButton } from "@/components/site/primary-button";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";

type Props = {
  priceLabel: string;
  /** Optional secondary link, e.g. from the sample result page into the sample report. `href` is already localized. */
  secondary?: { href: string; label: string };
};

/**
 * Closing block of the public sample. Everything here is already free to read, so the
 * invitation is to take the test — the price stays a footnote, not a headline.
 */
export async function SampleCta({ priceLabel, secondary }: Props) {
  const locale = await getLocale();
  const t = resultMessages[locale].sampleCta;

  return (
    <section className="mx-4 block bg-night-deep px-[27px] py-8 text-[#eff3f4] md:mx-0 md:grid md:grid-cols-2 md:items-center md:gap-[45px] md:p-10 xl:gap-[90px] xl:px-[60px] xl:py-14">
      <div>
        <p className="eyebrow text-[9px] text-[#99a6a9]">{t.eyebrow}</p>
        <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{t.heading}</h2>
        <p className="mt-[27px] text-[11px] leading-[2] text-[#a1afb2] md:text-[12px]">
          {t.body}
        </p>
      </div>
      <div className="mt-[30px] md:mt-0">
        <div className="flex items-center gap-[13px] xl:gap-6">
          {t.meta.map(([value, label], i) => (
            <span
              key={label}
              className={
                "flex items-center gap-1 text-[14px] font-medium whitespace-nowrap md:gap-[5px] md:text-[20px]" +
                (i > 0 ? " border-l border-[#33403f] pl-[13px] xl:pl-6" : "")
              }
            >
              {value} <small className="text-[8px] font-normal text-[#9eacb0] md:text-[11px]">{label}</small>
            </span>
          ))}
        </div>
        <div className="mt-[30px] hidden md:block">
          <PrimaryButton href={href(locale, "/quiz")} light>
            {t.start}
          </PrimaryButton>
        </div>
        {secondary && (
          <Link href={secondary.href} className="text-link mt-[18px] text-[12px] text-[#d8e0e2]">
            {secondary.label}
            <ArrowUpRight size={15} />
          </Link>
        )}
        <p className="mt-[22px] text-[9px] leading-[1.9] text-[#86999f] md:mt-[15px] md:text-[10px]">
          {t.footnote(priceLabel)}
        </p>
      </div>
    </section>
  );
}
