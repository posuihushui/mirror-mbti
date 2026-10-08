import type { Metadata } from "next";
import { Cards, CaretDown, ListChecks } from "@phosphor-icons/react/dist/ssr";
import { MirrorMark } from "@/components/brand/mirror-mark";
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
import { sampleProfile } from "@/lib/personality";
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
        {/* The test in three pictured steps, before any question. */}
        <ol className="mt-8 grid list-none gap-3 p-0 md:grid-cols-3">
          {t.steps.map(([title, body], i) => (
            <li key={title} className="flex items-center gap-4 bg-card p-4 md:flex-col md:items-start md:gap-3 md:p-5">
              <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full border border-warm bg-paper text-ink">
                {i === 0 ? <Cards size={22} weight="light" /> : i === 1 ? <ListChecks size={22} weight="light" /> : <MirrorMark profile={sampleProfile} size={30} />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-warm-ink">0{i + 1}</span>
                <span className="mt-0.5 block text-base font-medium">{title}</span>
                <span className="mt-1 block text-sm text-mist">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        {/* Answers stay in the HTML (and the FAQ JSON-LD); only the first is open. */}
        <div className="mt-8 border-t border-line">
          {items.map(([q, a], i) => (
            <details key={q} className="group border-b border-line" open={i === 0}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg leading-heading font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <CaretDown size={16} aria-hidden className="shrink-0 text-mist transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-6 text-base text-slate">{a}</p>
            </details>
          ))}
        </div>
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
