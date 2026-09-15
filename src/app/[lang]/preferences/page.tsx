import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { appUrl } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { preferenceDimensionsFor, preferenceNotesFor } from "@/lib/preference-content";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { siteCopy } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pageMessages[locale].preferences;
  return pageMetadata({ locale, title: t.metaTitle, description: t.metaDescription, path: "/preferences" });
}

export default async function PreferencesPage() {
  const locale = await getLocale();
  const t = pageMessages[locale].preferences;
  return <><AppHeader variant="page" title={t.headerTitle} backHref={href(locale, "/")} path="/preferences" />
    <main className="mx-auto max-w-[760px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">UNDERSTAND YOUR PREFERENCES</p>
      <h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">{t.heading}</h1>
      <p className="mt-5 text-[13px] leading-[2] text-mist">{t.intro}</p>
      {preferenceDimensionsFor(locale).map((d) => <section key={d.title} className="mt-7 border-t border-line pt-6">
        <h2 className="text-[20px]">{d.pair} · {d.title}</h2>
        <p className="mt-4 text-[13px] leading-[2] text-mist">{d.description}</p>
        <p className="mt-3 text-[13px] leading-[2]">{t.question(d.question)}</p>
      </section>)}
      {preferenceNotesFor(locale).map((note) => <section key={note.title} className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{note.title}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{note.body}</p></section>)}
      <div className="mt-8 flex flex-col gap-5"><PrimaryButton href={href(locale, "/quiz")}>{t.start}</PrimaryButton><Link href={href(locale, "/types")} className="text-link">{t.types}</Link></div>
    </main>
    <JsonLd data={breadcrumbJsonLd(appUrl(), [[siteCopy(locale).name, href(locale, "/")], [t.metaTitle, href(locale, "/preferences")]])} /></>;
}
