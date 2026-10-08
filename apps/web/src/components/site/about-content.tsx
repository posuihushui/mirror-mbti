"use client";

import { useRouter } from "next/navigation";
import { TextLink } from "@/components/site/text-link";
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
      <p className="my-6 text-base text-slate whitespace-pre-line">
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
              <p className="text-sm text-slate">{a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <TextLink href={href(locale, "/help")} className="mt-4" onClick={onStart} {...trackAttrs("view_help", "about_overlay")}>{t.help}</TextLink>
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
