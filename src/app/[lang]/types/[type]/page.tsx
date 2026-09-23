import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MirrorMark, typeMirrorProfile } from "@/components/brand/mirror-mark";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href, htmlLang } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { isPersonalityType, polesFor, TYPES, typeMeta, type Letter } from "@/lib/personality";
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
  const poles = polesFor(locale);
  const { name, line, summary, letters } = typeMeta(type, locale);
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
          <div className="bg-night px-6 py-8 text-paper md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-warm">{t.eyebrow}</p>
                {/* The type code is the page's H1 for search; the name sits under it. */}
                <h1 className="mt-6 text-7xl leading-none font-medium tracking-tighter md:text-8xl">
                  {type}
                  <TypeName name={name} className="mt-3 block text-sm font-normal tracking-normal text-night-body md:text-base" />
                </h1>
              </div>
              <MirrorMark profile={typeMirrorProfile(type)} tone="paper" size={120} className="size-22 shrink-0 md:size-30" />
            </div>
            <p className="mt-8 text-3xl leading-heading font-medium whitespace-pre-line md:text-4xl">{line}</p>
            <p className="mt-5 max-w-md text-sm text-night-body md:text-base">{summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {letters.map((l) => (
                <Badge key={l} className="border-night-line bg-white/5 text-paper">{t.badge(poles[l as Letter].label)}</Badge>
              ))}
            </div>
          </div>
          <div className="bg-card p-6 md:p-8">
            <div className="flex justify-between text-xs text-mist">
              <span>{t.dimsHeading}</span>
              <span aria-hidden>01 — 04</span>
            </div>
            <ul className="mt-4 list-none p-0">
              {letters.map((l, i) => (
                <li key={l} className="flex gap-4 border-b border-line py-5">
                  <span aria-hidden className="pt-1 text-xs text-warm-ink">0{i + 1}</span>
                  <div>
                    <h2 className="text-base font-medium">
                      {poles[l as Letter].label} <span className="ml-0.5 text-mist">{l}</span>
                      <span className="mt-1 block text-sm font-normal text-mist md:ml-3 md:inline">{poles[l as Letter].need}</span>
                    </h2>
                    <p className="mt-2 text-sm text-slate">{poles[l as Letter].strength}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-mist">
              {t.dimsNote}
            </p>
          </div>
        </section>
        <section className="mx-6 mb-10 border-t border-line pt-8 md:mx-auto md:max-w-3xl">
          <h2 className="text-2xl leading-heading">{t.whatIs(type)}</h2>
          <p className="mt-4 text-base text-slate">{context.definition}</p>
          <h2 className="mt-10 text-2xl leading-heading">{t.everydayHeading}</h2>
          <p className="mt-4 text-base text-slate">{t.everydayText(context.everyday)}</p>
          <h2 className="mt-10 text-2xl leading-heading">{t.misconceptions}</h2>
          <ul className="mt-4 flex list-none flex-col gap-3 p-0">{context.misconceptions.map((text) => <li key={text} className="border-l-2 border-line pl-4 text-base text-slate">{text}</li>)}</ul>
          <h2 className="mt-10 text-2xl leading-heading">{t.communicationHeading}</h2>
          <p className="mt-4 text-base text-slate">{t.communicationText(context.communication)}</p>
          <h2 className="mt-10 text-2xl leading-heading">{t.neighborsHeading}</h2>
          <p className="mt-4 text-sm text-mist">{t.neighborsText}</p>
          <ul className="mt-5 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
            {context.neighbors.map((neighbor) => (
              <li key={neighbor.type}>
                <Link href={href(locale, `/types/${neighbor.type}`)} className="group flex h-full flex-col gap-1 border border-line bg-card p-4 transition-colors hover:border-[#9eacb0]" {...trackAttrs("view_type", "type_context")}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-2xl leading-none font-medium tracking-tighter">{neighbor.type}</span>
                    <MirrorMark profile={typeMirrorProfile(neighbor.type)} size={32} className="shrink-0" />
                  </span>
                  <span className="text-xs text-mist">{typeMeta(neighbor.type, locale).name}</span>
                  <span className="mt-2 flex items-center justify-between text-xs text-warm-ink">
                    {t.neighborDiffers(neighbor.dimension.split("").join(" / "))}
                    <ArrowRight size={14} aria-hidden className="text-mist transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
