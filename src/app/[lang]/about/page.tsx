import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { faqsFor, siteCopy } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pageMessages[locale].about;
  return pageMetadata({ locale, title: t.metaTitle, description: t.metaDescription, path: "/about" });
}

/** Static "了解测试" page. The same copy also appears in the in-app sheet; this page exists for search and direct links. */
export default async function AboutPage() {
  const locale = await getLocale();
  const t = pageMessages[locale].about;
  const items = faqsFor(locale);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <>
      <AppHeader variant="page" title={t.headerTitle} backHref={href(locale, "/")} path="/about" />
      <main className="mx-auto max-w-2xl px-6 pt-8 pb-[135px] md:px-10 md:pt-14 md:pb-20">
        <p className="eyebrow text-mist">{t.eyebrow}</p>
        <h1 className="mt-4 text-3xl leading-heading md:text-4xl">
          {t.headerTitle}
        </h1>
        <p className="mt-5 text-base text-slate whitespace-pre-line">
          {siteMessages[locale].about.intro}
        </p>
        <dl className="mt-8 border-t border-line">
          {items.map(([q, a]) => (
            <div key={q} className="border-b border-line py-6">
              <dt className="text-lg leading-heading font-medium">{q}</dt>
              <dd className="m-0 mt-2 text-base text-slate">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-mist">
          {t.disclaimer}
        </p>
        <div className="mt-8 hidden md:block">
          <PrimaryButton href={href(locale, "/quiz")} className="max-w-xs" {...trackAttrs("start_quiz", "page_cta")}>
            {t.start}
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
      </Dock>
      <JsonLd data={faqJsonLd} />
      <span className="sr-only">{siteCopy(locale).name}</span>
    </>
  );
}
