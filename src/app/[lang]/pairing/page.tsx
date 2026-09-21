import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { PairingExample } from "@/components/pairing/pairing-example";
import { PairingReveal } from "@/components/pairing/pairing-reveal";
import { href } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale(); const m = pairingMessages[locale];
  return pageMetadata({ locale, path: "/pairing", title: m.title, description: m.summary });
}
export default async function PairingPage() {
  const locale = await getLocale(); const m = pairingMessages[locale]; const ui = pairingUiMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/")} path="/pairing" /><main className="mx-auto max-w-[1040px] px-6 py-8 md:py-14">
    <PairingReveal><p className="eyebrow text-mist">{ui.introEyebrow}</p><h1 className="mt-5 max-w-[700px] text-[28px] leading-[1.5] md:text-[42px]">{m.heading}</h1><p className="mt-5 max-w-[680px] text-sm leading-[1.9]">{m.summary}</p></PairingReveal>
    <div className="my-8 md:my-12"><PairingExample locale={locale} /></div>
    <section className="border-t border-line py-8"><h2 className="text-2xl leading-[1.5]">{ui.stepsTitle}</h2><ol className="mt-6 grid gap-5 md:grid-cols-3">{ui.publicSteps.map((step, i) => <li key={step} className="border border-line p-5 text-sm leading-[1.8]"><span aria-hidden="true" className="mb-3 block text-xs text-[#c49473]">0{i + 1}</span>{step}</li>)}</ol></section>
    <p className="mb-5 text-sm leading-[1.9] text-mist">{ui.noConsentYet}</p><p className="mb-7 text-xs leading-[1.9] text-mist">{m.note}</p>
    <div className="flex flex-col gap-4 md:flex-row md:items-center"><a className="pill min-h-11" href={href(locale, "/quiz")}>{ui.start}</a><a className="text-link min-h-11 text-sm" href={href(locale, "/my/report")}>{ui.myReports}</a></div>
  </main></>;
}
