import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MirrorMark, typeMirrorProfile } from "@/components/brand/mirror-mark";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { TYPES, typeMeta } from "@/lib/personality";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { siteCopy } from "@/lib/site";
import { TypeName } from "@/components/result/type-name";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pageMessages[locale].types;
  return pageMetadata({
    locale,
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/types",
    shareTitle: t.shareTitle(siteCopy(locale).name),
  });
}

export default async function TypesPage() {
  const locale = await getLocale();
  const messages = pageMessages[locale];
  const t = messages.types;
  const url = appUrl();
  const jsonLd = [
    breadcrumbJsonLd(url, [[siteCopy(locale).name, href(locale, "/")], [t.headerTitle, href(locale, "/types")]]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t.headerTitle,
      numberOfItems: TYPES.length,
      itemListElement: TYPES.map((type, i) => ({ "@type": "ListItem", position: i + 1, name: messages.type.crumb(type, typeMeta(type, locale).name), url: `${url}${href(locale, `/types/${type}`)}` })),
    },
  ];
  return (
    <>
      <AppHeader variant="page" title={t.headerTitle} backHref={href(locale, "/")} path="/types" />
      <main className="mx-auto max-w-6xl px-6 pt-6 pb-[135px] md:px-10 md:pt-14 md:pb-20">
        <p className="eyebrow text-mist">{t.eyebrow}</p>
        <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{t.heading}</h1>
        <p className="mt-5 max-w-xl text-sm text-mist md:text-base">
          {t.intro}
        </p>
        {t.groups.map(([letters, groupName, description]) => (
          <section key={letters} className="mt-10 md:mt-14" aria-labelledby={`group-${letters}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
              <h2 id={`group-${letters}`} className="text-xl">{groupName} <span className="ml-1 text-sm font-normal text-mist">{letters}</span></h2>
              <p className="text-sm text-mist">{description}</p>
            </div>
            <ul className="mt-4 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 md:gap-4">
              {TYPES.filter((type) => type.slice(1, 3) === letters).map((type) => {
                const { name, line } = typeMeta(type, locale);
                return (
                  <li key={type}>
                    <Link href={href(locale, `/types/${type}`)} className="group flex h-full flex-col border border-line bg-card p-4 transition-colors hover:border-[#9eacb0] md:p-5" {...trackAttrs("view_type", "type_grid")}>
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-3xl leading-none font-medium tracking-tighter md:text-4xl">{type}</span>
                          <TypeName name={name} className="mt-2 block text-xs text-mist" />
                        </span>
                        <MirrorMark profile={typeMirrorProfile(type)} size={44} className="shrink-0" />
                      </span>
                      <span className="mt-4 text-sm text-slate whitespace-pre-line">{line}</span>
                      <span aria-hidden className="mt-auto flex justify-end pt-3"><ArrowRight size={16} className="text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ink" /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <p className="mt-10 max-w-2xl text-xs text-mist">{t.markNote}</p>
        <div className="mt-8 hidden md:block">
          <PrimaryButton href={href(locale, "/quiz")} className="max-w-xs" {...trackAttrs("start_quiz", "page_cta")}>
            {t.start}
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "dock")}>{t.start}</PrimaryButton>
      </Dock>
      <JsonLd data={jsonLd} />
    </>
  );
}
