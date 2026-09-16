import { shareHelpMessages } from "@/lib/i18n/messages/share-help";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
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
      <p className="eyebrow text-mist">{t.eyebrow}</p><h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">{t.heading}</h1>
      <div className="mt-7"><PrimaryButton href={href(locale, "/my/report")} prefetch={false} {...trackAttrs("my_report", "page_cta")}>{t.records}</PrimaryButton></div>
      {t.sections.map(([title, body]) => <section key={title} className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{title}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{body}</p></section>)}
      <section className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{shareHelpMessages[locale].title}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{shareHelpMessages[locale].body}</p><Link href={href(locale,"/my/shares")} prefetch={false} className="text-link mt-4">{shareMessages[locale].myShares}</Link></section>
      <section id="contact" className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{t.contactHeading}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{t.contactText}</p><a href={`mailto:${site.supportEmail}`} className="text-link mt-3 min-h-11 break-all" {...trackAttrs("contact_email", "page_cta")}>{site.supportEmail}</a></section>
    </main></>;
}
