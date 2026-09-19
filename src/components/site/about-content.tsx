"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";
import { faqsFor } from "@/lib/site";

/** `.about-content`: intro line, FAQ accordion (first item open), CTA. */
export function AboutContent({ onStart }: { onStart?: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const t = siteMessages[locale].about;
  const items = faqsFor(locale);
  return (
    <div>
      <p className="my-[27px] text-[14px] leading-[2] text-[#78878e] whitespace-pre-line">
        {t.intro}
      </p>
      <Accordion
        type="single"
        collapsible
        defaultValue="0"
        onValueChange={(value) => {
          if (value) track("faq_open", { faq_index: Number(value) + 1, cta_location: "about_overlay" });
        }}
      >
        {items.map(([q, a], i) => (
          <AccordionItem key={q} value={String(i)}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-[13px] leading-[2.1] text-[#6d7f88]">{a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Link href={href(locale, "/help")} className="text-link mt-5 min-h-11" onClick={onStart} {...trackAttrs("view_help", "about_overlay")}>{t.help}</Link>
      <PrimaryButton
        className="mt-6"
        onClick={() => {
          onStart?.();
          router.push(href(locale, "/quiz"));
        }}
        {...trackAttrs("start_quiz", "about_overlay")}
      >
        {t.start}
      </PrimaryButton>
    </div>
  );
}
