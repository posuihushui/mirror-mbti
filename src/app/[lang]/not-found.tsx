import type { Metadata } from "next";
import { TrackView } from "@/components/analytics/track-view";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: siteMessages[locale].notFound.title };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = siteMessages[locale].notFound;
  const home = href(locale, "/");
  return (
    <>
      <AppHeader variant="page" title={t.title} backHref={home} />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-[120px] md:pt-[60px]">
        <p className="eyebrow text-mist">404</p>
        <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{t.heading}</h1>
        <p className="mt-5 text-sm text-mist">{t.body}</p>
        <div className="mt-8 hidden md:block">
          <PrimaryButton href={home} className="max-w-xs" {...trackAttrs("home", "page_cta")}>
            {t.home}
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href={home} {...trackAttrs("home", "dock")}>{t.home}</PrimaryButton>
      </Dock>
      <TrackView event="page_not_found" />
    </>
  );
}
