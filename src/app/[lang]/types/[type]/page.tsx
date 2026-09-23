import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MirrorMark, typeMirrorProfile } from "@/components/brand/mirror-mark";
import { DimensionSpectrum, EverydayFlow, LetterBreakdown, MisconceptionList, NeighborTree, SayItBubble, TypeMap } from "@/components/types/type-diagrams";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href, htmlLang } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { isPersonalityType, TYPES, typeMeta } from "@/lib/personality";
import { breadcrumbJsonLd, contentUpdatedAt, pageMetadata, websiteId } from "@/lib/seo";
import { siteCopy } from "@/lib/site";
import { typeContext } from "@/lib/type-context";
import { TypeName } from "@/components/result/type-name";

type Params = { params: Promise<{ type: string }> };

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { type } = await params;
  if (!isPersonalityType(type)) return {};
  const locale = await getLocale();
  const t = pageMessages[locale].type;
  const { name, line, summary } = typeMeta(type, locale);
  return pageMetadata({
    locale,
    title: t.metaTitle(type, name),
    description: `${line.replace("\n", locale === "en" ? " " : "")} ${summary}`,
    path: `/types/${type}`,
    shareTitle: t.shareTitle(type, name, siteCopy(locale).name),
    shareDescription: summary,
    image: `/types/${type}/opengraph-image`,
  });
}

export default async function TypePage({ params }: Params) {
  const { type } = await params;
  if (!isPersonalityType(type)) notFound();
  const locale = await getLocale();
  const messages = pageMessages[locale];
  const t = messages.type;
  const { name, line, summary } = typeMeta(type, locale);
  const context = typeContext(type, locale);
  const url = appUrl();
  const jsonLd = [
    breadcrumbJsonLd(url, [[siteCopy(locale).name, href(locale, "/")], [messages.types.headerTitle, href(locale, "/types")], [t.crumb(type, name), href(locale, `/types/${type}`)]]),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: `${url}${href(locale, `/types/${type}`)}`,
      name: t.pageName(type, name),
      description: context.definition,
      inLanguage: htmlLang[locale],
      dateModified: contentUpdatedAt,
      isPartOf: { "@id": websiteId(url, locale) },
      about: {
        "@type": "DefinedTerm",
        name: type,
        ...(locale === "zh" ? { alternateName: `${name}型人格` } : {}),
        description: context.definition,
        inDefinedTermSet: `${url}${href(locale, "/types")}`,
      },
    },
  ];

  return (
    <>
      <AppHeader variant="page" title={messages.types.headerTitle} backHref={href(locale, "/types")} path={`/types/${type}`} />
      <main className="pb-[120px] md:mx-auto md:max-w-6xl md:px-10 md:pb-20">
        <section className="grid gap-4 md:grid-cols-2 md:items-stretch md:pt-8 md:pb-12">
          <div className="flex flex-col bg-night px-6 py-8 text-paper md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-warm">{t.eyebrow}</p>
                {/* The type code is the page's H1 for search. Chinese adds its name; English names are the four
                    preference labels, which the letter breakdown below already spells out. */}
                <h1 className="mt-6 text-7xl leading-none font-medium tracking-tighter md:text-8xl">
                  {type}
                  {locale === "zh" && <TypeName name={name} className="mt-3 block text-sm font-normal tracking-normal text-night-body md:text-base" />}
                </h1>
              </div>
              <MirrorMark profile={typeMirrorProfile(type)} tone="paper" size={120} className="size-22 shrink-0 md:size-30" />
            </div>
            <p className="mt-8 text-3xl leading-heading font-medium whitespace-pre-line md:text-4xl">{line}</p>
            <p className="mt-5 max-w-md text-sm text-night-body md:text-base">{summary}</p>
            <div className="mt-8 md:mt-auto md:pt-10"><LetterBreakdown type={type} locale={locale} /></div>
          </div>
          {/* Which side of each pair, as a chart: the dimensions this type is made of. */}
          <div className="bg-card p-6 md:p-8">
            <div className="flex justify-between text-xs text-mist">
              <h2 className="text-xs font-normal">{t.dimsHeading}</h2>
              <span aria-hidden>01 — 04</span>
            </div>
            <div className="mt-6"><DimensionSpectrum type={type} locale={locale} /></div>
            <p className="mt-6 text-xs text-mist">
              {t.dimsNote}
            </p>
          </div>
        </section>

        <div className="mx-6 md:mx-0">
          <section className="max-w-3xl border-t border-line pt-8" aria-labelledby="what-is">
            <h2 id="what-is" className="text-2xl leading-heading">{t.whatIs(type)}</h2>
            <p className="mt-4 text-base text-slate">{context.definition}</p>
          </section>

          <section className="mt-14" aria-labelledby="everyday">
            <h2 id="everyday" className="text-2xl leading-heading">{t.everydayHeading}</h2>
            <p className="mt-3 text-sm text-mist">{t.everydayLead}</p>
            <div className="mt-8"><EverydayFlow type={type} locale={locale} items={context.everyday} /></div>
            <p className="mt-6 text-xs text-mist">{t.everydayNote}</p>
          </section>

          <div className="mt-14 grid gap-14 md:grid-cols-2 md:gap-12">
            <section aria-labelledby="misconceptions">
              <h2 id="misconceptions" className="text-2xl leading-heading">{t.misconceptions}</h2>
              <div className="mt-6"><MisconceptionList type={type} locale={locale} items={context.misconceptions} /></div>
            </section>
            <section aria-labelledby="communication">
              <h2 id="communication" className="text-2xl leading-heading">{t.communicationHeading}</h2>
              <div className="mt-6"><SayItBubble type={type} locale={locale} line={context.communication} /></div>
              <p className="mt-5 text-sm text-mist">{t.communicationAdvice}</p>
            </section>
          </div>

          {/* Both diagrams place this type among the others: by one letter, then among all sixteen. */}
          <div className="mt-14 mb-14 grid gap-14 md:grid-cols-2 md:gap-12">
            <section aria-labelledby="neighbors">
              <h2 id="neighbors" className="text-2xl leading-heading">{t.neighborsHeading}</h2>
              <p className="mt-3 text-sm text-mist">{t.neighborsText}</p>
              <div className="mt-8"><NeighborTree type={type} locale={locale} neighbors={context.neighbors} location="type_context" /></div>
            </section>
            <section aria-labelledby="type-map">
              <h2 id="type-map" className="text-2xl leading-heading">{t.mapHeading}</h2>
              <div className="mt-6"><TypeMap locale={locale} current={type} location="type_context" /></div>
            </section>
          </div>
        </div>

        <section className="warm-panel mx-4 px-6 py-8 md:mx-0 md:flex md:items-center md:justify-between md:gap-10 md:p-10">
          <div>
            <p className="eyebrow">{t.ctaEyebrow}</p>
            <h2 className="mt-5 text-3xl leading-heading md:text-4xl">{t.ctaHeading}</h2>
          </div>
          <div className="mt-6 flex flex-col gap-2 md:mt-0 md:w-[300px]">
            <div className="hidden md:block">
              <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "page_cta")}>
                {t.start}
              </PrimaryButton>
            </div>
            <TextLink href={href(locale, "/types")} className="text-ink" {...trackAttrs("view_types", "page_cta")}>
              {t.allTypes}
            </TextLink>
          </div>
        </section>
      </main>
      <Dock>
        <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
      </Dock>
      <JsonLd data={jsonLd} />
    </>
  );
}
