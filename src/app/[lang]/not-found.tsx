import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { PrimaryButton } from "@/components/site/primary-button";
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
        <p className="eyebrow text-[#738087]">404</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{t.heading}</h1>
        <p className="mt-[23px] text-[13px] leading-[1.9] text-[#6b777d]">{t.body}</p>
        <div className="mt-8 hidden md:block">
          <PrimaryButton href={home} className="max-w-[246px]">
            {t.home}
          </PrimaryButton>
        </div>
      </main>
      <Dock>
        <PrimaryButton href={home}>{t.home}</PrimaryButton>
      </Dock>
    </>
  );
}
