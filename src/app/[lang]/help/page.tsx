import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pageMessages[locale].help;
  return pageMetadata({ locale, title: t.metaTitle, description: t.metaDescription, path: "/help" });
}

export default async function HelpPage() {
  const locale = await getLocale();
  const t = pageMessages[locale].help;
  return <><AppHeader variant="page" title={t.headerTitle} backHref={href(locale, "/")} path="/help" />
    <main className="mx-auto max-w-[760px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">HERE TO HELP</p><h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">{t.heading}</h1>
      <div className="mt-7"><PrimaryButton href={href(locale, "/my/report")} prefetch={false}>{t.records}</PrimaryButton></div>
      {t.sections.map(([title, body]) => <section key={title} className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{title}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{body}</p></section>)}
      <section id="contact" className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{t.contactHeading}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{t.contactText}</p><a href={`mailto:${site.supportEmail}`} className="text-link mt-3 min-h-11 break-all">{site.supportEmail}</a></section>
      <nav className="mt-7 flex flex-wrap gap-6 text-[12px]" aria-label={t.navLabel}><Link href={href(locale, "/about")} className="text-link">{t.about}</Link><Link href={href(locale, "/preferences")} className="text-link">{t.preferences}</Link><Link href={href(locale, "/privacy")} className="text-link">{t.privacy}</Link></nav>
    </main></>;
}
