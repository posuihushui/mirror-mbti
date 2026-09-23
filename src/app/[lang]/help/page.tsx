import { shareHelpMessages } from "@/lib/i18n/messages/share-help";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
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
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
      <p className="eyebrow text-mist">{t.eyebrow}</p>
      <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{t.heading}</h1>
      <PrimaryButton href={href(locale, "/my/report?recover=1")} prefetch={false} className="mt-8 md:max-w-xs" {...trackAttrs("my_report", "page_cta")}>{t.records}</PrimaryButton>
      <div className="mt-10 border-t border-line">
        {t.sections.map(([title, body]) => <section key={title} className="border-b border-line py-7"><h2 className="text-xl leading-heading">{title}</h2><p className="mt-3 text-base text-slate">{body}</p></section>)}
        <section className="border-b border-line py-7"><h2 className="text-xl leading-heading">{shareHelpMessages[locale].title}</h2><p className="mt-3 text-base text-slate">{shareHelpMessages[locale].body}</p><TextLink href={href(locale,"/my/shares")} prefetch={false} className="mt-2">{shareMessages[locale].myShares}</TextLink></section>
      </div>
      <section id="contact" className="mt-10 bg-card p-6 md:p-8"><h2 className="text-xl leading-heading">{t.contactHeading}</h2><p className="mt-3 text-base text-slate">{t.contactText}</p><TextLink external href={`mailto:${site.supportEmail}`} className="mt-2 break-all font-medium" {...trackAttrs("contact_email", "page_cta")}>{site.supportEmail}</TextLink></section>
    </main></>;
}
