"use client";

import { BookOpen } from "@phosphor-icons/react";
import { TextLink } from "@/components/site/text-link";
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
      <BookOpen size={44} weight="thin" className="mx-auto text-mist" />
      <p className="mt-5 mb-8 text-sm text-mist whitespace-pre-line">
        {t.text}
      </p>
      <PrimaryButton href={href(locale, "/quiz")} onClick={onNavigate} {...trackAttrs("start_quiz", "empty_overlay")}>
        {t.start}
      </PrimaryButton>
      <TextLink href={href(locale, "/result/sample")} onClick={onNavigate} className="mt-3" {...trackAttrs("view_sample_result", "empty_overlay")}>
        {t.sample}
      </TextLink>
    </div>
  );
}
