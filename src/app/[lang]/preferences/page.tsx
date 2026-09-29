import type { Metadata } from "next";
import { Illustration } from "@/components/illustrations/scene";
import { poleScenes } from "@/components/illustrations/pole-scenes";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { dimensions, polesFor, type Letter } from "@/lib/personality";
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
  const poles = polesFor(locale);
  return <><AppHeader variant="page" title={t.headerTitle} backHref={href(locale, "/")} path="/preferences" />
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{t.heading}</h1>
      <p className="mt-5 text-base text-slate">{t.intro}</p>
      <div className="mt-8 border-t border-line">
        {preferenceDimensionsFor(locale).map((d, index) => <section key={d.title} className="grid gap-3 border-b border-line py-7 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
          <div>
            <span aria-hidden className="text-xs text-warm-ink">0{index + 1}</span>
            <h2 className="mt-2 text-xl leading-heading">{d.title}</h2>
            <p className="mt-1 text-sm text-mist">{d.pair}</p>
          </div>
          <div>
            {/* Each end as an everyday picture with the need it starts from; the text below explains the pair. */}
            <ul className="mb-5 grid list-none grid-cols-2 gap-3 p-0">
              {(dimensions[index].split("") as Letter[]).map((letter) => <li key={letter} className="bg-card p-3 md:p-4">
                <Illustration scene={poleScenes[letter]} className="mx-auto w-full max-w-44" />
                <p className="mt-2 text-sm font-medium">{poles[letter].label} {letter}</p>
                <p className="mt-0.5 text-xs text-mist">{poles[letter].need}</p>
              </li>)}
            </ul>
            <p className="text-base text-slate">{d.description}</p>
            <p className="mt-4 border-l-2 border-warm pl-4 text-base">{t.question(d.question)}</p>
          </div>
        </section>)}
      </div>
      {preferenceNotesFor(locale).map((note) => <section key={note.title} className="mt-10"><h2 className="text-2xl leading-heading">{note.title}</h2><p className="mt-4 text-base text-slate">{note.body}</p></section>)}
      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:gap-8"><PrimaryButton href={href(locale, "/quiz")} className="md:max-w-xs" {...trackAttrs("start_quiz", "page_cta")}>{t.start}</PrimaryButton><TextLink href={href(locale, "/types")} {...trackAttrs("view_types", "page_cta")}>{t.types}</TextLink></div>
    </main>
    <JsonLd data={breadcrumbJsonLd(appUrl(), [[siteCopy(locale).name, href(locale, "/")], [t.metaTitle, href(locale, "/preferences")]])} /></>;
}
