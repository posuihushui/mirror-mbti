"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen } from "@phosphor-icons/react";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";

/** `.empty-report`: shown from "我的报告" before any test has been completed. */
export function EmptyReportContent({ onNavigate }: { onNavigate?: () => void }) {
  const locale = useLocale();
  const t = siteMessages[locale].empty;
  return (
    <div className="pt-[35px] text-center">
      <BookOpen size={44} weight="thin" className="mx-auto text-[#8ea0a8]" />
      <p className="mt-[22px] mb-8 text-[12px] leading-[2] text-[#829198] whitespace-pre-line">
        {t.text}
      </p>
      <PrimaryButton href={href(locale, "/quiz")} onClick={onNavigate} {...trackAttrs("start_quiz", "empty_overlay")}>
        {t.start}
      </PrimaryButton>
      <Link href={href(locale, "/result/sample")} onClick={onNavigate} className="text-link mt-[15px]" {...trackAttrs("view_sample_result", "empty_overlay")}>
        {t.sample}
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
