import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
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
      isPartOf: { "@id": websiteId(url) },
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
      <main className="pt-[15px] pb-[120px] md:mx-auto md:max-w-[1150px] md:px-10 md:pt-0 md:pb-[70px]">
        <section className="block md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-[58px] md:pb-[50px] xl:gap-20">
          <div className="px-[27px] pt-[17px] pb-[35px] md:p-0">
            <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">{t.eyebrow}</p>
            {/* The type code is the page's H1 for search; it keeps the prototype's giant-letter styling. */}
            <h1 className="my-6 flex items-baseline gap-[17px] text-[79px] leading-[1.15] font-medium tracking-[-0.055em] md:mt-6 md:mb-[22px] md:gap-[22px] md:text-[102px]">
              {type}
              <span className="text-[14px] font-normal tracking-[0.08em] md:text-[16px]">{name}</span>
            </h1>
            <p className="text-[27px] leading-[1.6] font-medium tracking-[-0.035em] whitespace-pre-line md:text-[32px]">{line}</p>
            <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">{summary}</p>
            <div className="mt-6 flex gap-2">
              {letters.slice(0, 3).map((l) => (
                <Badge key={l}>{t.badge(poles[l as Letter].label)}</Badge>
              ))}
            </div>
          </div>
          <div className="border-t border-line px-[27px] pt-[25px] pb-[35px] md:border-t-0 md:border-l md:pt-[15px] md:pr-0 md:pb-0 md:pl-[35px]">
            <div className="flex justify-between text-[10px] text-[#58676d] md:text-[11px]">
              <span>{t.dimsHeading}</span>
              <span className="text-[9px] text-[#8c999e]">01 — 04</span>
            </div>
            <ul className="mt-5 list-none p-0">
              {letters.map((l, i) => (
                <li key={l} className="flex gap-4 border-b border-line py-5">
                  <span className="pt-[3px] text-[9px] text-[#a38f7a]">0{i + 1}</span>
                  <div>
                    <h2 className="text-[14px] font-medium tracking-normal">
                      {poles[l as Letter].label} <small className="ml-1 text-[#8a969b]">{l}</small>
                      <span className="ml-3 text-[11px] font-normal text-[#758287]">{poles[l as Letter].need}</span>
                    </h2>
                    <p className="mt-2 text-[12px] leading-[2] text-[#6b777d]">{poles[l as Letter].strength}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-[23px] text-[9px] leading-[1.8] text-[#7f8e94]">
              {t.dimsNote}
            </p>
          </div>
        </section>
        <section className="mx-[27px] mb-8 border-t border-line pt-7 md:mx-0">
          <h2 className="text-[22px]">{t.whatIs(type)}</h2>
          <p className="mt-4 text-[13px] leading-[2] text-mist">{context.definition}</p>
          <h2 className="mt-8 text-[22px]">{t.everydayHeading}</h2>
          <p className="mt-4 text-[13px] leading-[2] text-mist">{t.everydayText(context.everyday)}</p>
          <h3 className="mt-6 text-[18px]">{t.misconceptions}</h3>
          <ul className="mt-3 flex list-disc flex-col gap-3 pl-5 text-[13px] leading-[2] text-mist">{context.misconceptions.map((text) => <li key={text}>{text}</li>)}</ul>
          <h3 className="mt-6 text-[18px]">{t.communicationHeading}</h3>
          <p className="mt-3 text-[13px] leading-[2] text-mist">{t.communicationText(context.communication)}</p>
          <h3 className="mt-6 text-[18px]">{t.neighborsHeading}</h3>
          <p className="mt-3 text-[12px] leading-[2] text-mist">{t.neighborsText}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{context.neighbors.map((neighbor) => <Link key={neighbor.type} href={href(locale, `/types/${neighbor.type}`)} className="text-link min-h-11" {...trackAttrs("view_type", "type_context")}>{t.crumb(neighbor.type, typeMeta(neighbor.type, locale).name)} · {neighbor.dimension.split("").join(" / ")}</Link>)}</div>
        </section>
        <section className="mx-4 bg-night-deep px-[27px] py-8 text-[#eff3f4] md:mx-0 md:flex md:items-center md:justify-between md:gap-10 md:p-10 xl:px-[60px] xl:py-14">
          <div>
            <p className="eyebrow text-[9px] text-[#99a6a9]">{t.ctaEyebrow}</p>
            <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{t.ctaHeading}</h2>
          </div>
          <div className="mt-[30px] flex flex-col gap-4 md:mt-0 md:w-[300px]">
            <div className="hidden md:block">
              <PrimaryButton href={href(locale, "/quiz")} light {...trackAttrs("start_quiz", "page_cta")}>
                {t.start}
              </PrimaryButton>
            </div>
            <Link href={href(locale, "/types")} className="text-link text-[12px] text-[#d8e0e2]" {...trackAttrs("view_types", "page_cta")}>
              {t.allTypes} <ArrowUpRight size={15} />
            </Link>
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
