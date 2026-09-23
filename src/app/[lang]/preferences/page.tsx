import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
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
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">{t.heading}</h1>
      <p className="mt-5 text-[13px] leading-[2] text-mist">{t.intro}</p>
      <div className="mt-8 space-y-5">
        {preferenceDimensionsFor(locale).map((d, index) => <section key={d.title} className="grid overflow-hidden border border-line bg-card md:grid-cols-[9rem_1fr]">
          <div className="bg-night p-5 text-paper md:p-6">
            <span className="eyebrow text-warm">0{index + 1}</span>
            <h2 className="mt-4 text-lg leading-relaxed">{d.pair}<br />{d.title}</h2>
          </div>
          <div className="p-5 md:p-6">
            <p className="text-[13px] leading-8 text-mist">{d.description}</p>
            <p className="warm-panel mt-5 p-4 text-[13px] leading-8">{t.question(d.question)}</p>
          </div>
        </section>)}
      </div>
      {preferenceNotesFor(locale).map((note) => <section key={note.title} className="mt-8 border-l-2 border-warm pl-5"><h2 className="text-xl">{note.title}</h2><p className="mt-4 text-[13px] leading-8 text-mist">{note.body}</p></section>)}
      <div className="mt-8 flex flex-col gap-5"><PrimaryButton href={href(locale, "/quiz")} {...trackAttrs("start_quiz", "page_cta")}>{t.start}</PrimaryButton><Link href={href(locale, "/types")} className="text-link" {...trackAttrs("view_types", "page_cta")}>{t.types}</Link></div>
    </main>
    <JsonLd data={breadcrumbJsonLd(appUrl(), [[siteCopy(locale).name, href(locale, "/")], [t.metaTitle, href(locale, "/preferences")]])} /></>;
}
