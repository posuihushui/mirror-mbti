import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { appUrl } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { TYPES, typeMeta } from "@/lib/personality";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { siteCopy } from "@/lib/site";

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
      <main className="mx-auto max-w-[1100px] px-[27px] pt-4 pb-[135px] md:px-10 md:pt-[60px] md:pb-[80px]">
        <p className="eyebrow text-[#738087]">SIXTEEN WAYS OF BEING</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{t.heading}</h1>
        <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">
          {t.intro}
        </p>
        <ul className="mt-10 grid list-none grid-cols-2 gap-px bg-line p-0 md:grid-cols-4">
          {TYPES.map((type) => {
            const { name, line } = typeMeta(type, locale);
            return (
              <li key={type} className="bg-paper">
                <Link href={href(locale, `/types/${type}`)} className="group flex h-full flex-col gap-3 px-4 py-6 md:px-6 md:py-8">
                  <span className="text-[34px] leading-none font-medium tracking-[-0.055em] md:text-[40px]">{type}</span>
                  <span className="text-[12px] tracking-[0.08em] text-[#5c6a70]">{name}</span>
                  <span className="text-[11px] leading-[1.9] text-[#7d898e] whitespace-pre-line">{line}</span>
                  <span className="mt-auto flex items-center gap-2 text-[11px] text-[#5d696d] group-hover:text-ink">
                    {t.learnMore} <ArrowUpRight size={13} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 hidden md:block">
          <PrimaryButton href={href(locale, "/quiz")} className="max-w-[246px]">
            {t.start}
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href={href(locale, "/quiz")}>{t.start}</PrimaryButton>
      </Dock>
      <JsonLd data={jsonLd} />
    </>
  );
}
