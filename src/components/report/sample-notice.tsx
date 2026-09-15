import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";

/** Marks the sample report as a sample, right above the reading, and offers the test. */
export async function SampleNotice() {
  const locale = await getLocale();
  const t = resultMessages[locale].sampleNotice;
  return (
    <div className="flex flex-col gap-4 border-b border-line px-[27px] pt-5 pb-[18px] md:flex-row md:items-end md:justify-between md:gap-10 md:px-0 md:pt-0 md:pb-6">
      <div>
        <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">{t.eyebrow}</p>
        <p className="mt-2 max-w-[560px] text-[12px] leading-[1.9] text-[#6b777d] md:text-[13px]">
          {t.body}
        </p>
      </div>
      <Link href={href(locale, "/quiz")} className="text-link shrink-0 text-[12px] whitespace-nowrap" {...trackAttrs("start_quiz", "sample_notice")}>
        {t.start}
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
