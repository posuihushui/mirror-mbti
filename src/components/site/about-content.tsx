"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PrimaryButton } from "@/components/site/primary-button";
import { faqs } from "@/lib/site";

/** `.about-content`: intro line, FAQ accordion (first item open), CTA. */
export function AboutContent({ priceLabel, onStart }: { priceLabel: string; onStart?: () => void }) {
  const router = useRouter();
  const items = faqs(priceLabel);
  return (
    <div>
      <p className="my-[27px] text-[14px] leading-[2] text-[#78878e] whitespace-pre-line">
        {"认识自己，不是把自己放进一个盒子。\n是多一种理解自己的语言。"}
      </p>
      <Accordion type="single" collapsible defaultValue="0">
        {items.map(([q, a], i) => (
          <AccordionItem key={q} value={String(i)}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-[13px] leading-[2.1] text-[#6d7f88]">{a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Link href="/help" className="text-link mt-5 min-h-11" onClick={onStart}>订单帮助与联系</Link>
      <PrimaryButton
        className="mt-6"
        onClick={() => {
          onStart?.();
          router.push("/quiz");
        }}
      >
        开始认识自己
      </PrimaryButton>
    </div>
  );
}
