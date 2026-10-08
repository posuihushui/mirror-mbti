import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { PairingExample } from "@/components/pairing/pairing-example";
import { PairingReveal } from "@/components/pairing/pairing-reveal";
import { href } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { pageMetadata } from "@/lib/seo";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { Illustration } from "@/components/illustrations/scene";
import { pairScene } from "@/components/illustrations/moment-scenes";
import { RelationshipCards } from "@/components/pairing/relationship-cards";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale(); const m = pairingMessages[locale];
  return pageMetadata({ locale, path: "/pairing", title: m.title, description: m.summary });
}
export default async function PairingPage() {
  const locale = await getLocale(); const m = pairingMessages[locale]; const ui = pairingUiMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/")} path="/pairing" /><main className="mx-auto max-w-5xl px-6 pt-8 pb-16 md:pt-14">
    <section className="md:grid md:grid-cols-[minmax(0,1fr)_300px] md:items-center md:gap-12">
      <PairingReveal><p className="eyebrow text-warm-ink">{ui.introEyebrow}</p><h1 className="mt-4 max-w-3xl text-3xl leading-heading md:text-5xl">{m.heading}</h1><p className="mt-5 max-w-2xl text-base text-slate">{m.summary}</p></PairingReveal>
      <Illustration scene={pairScene} className="mx-auto mt-8 w-full max-w-64 md:mt-0 md:max-w-none" />
    </section>
    <div className="my-10 md:my-14"><PairingExample locale={locale} relationship="partner" /></div>
    {/* The feature's point: the same difference, written for each relationship. Scenes and topic titles only, never a reading. */}
    <section data-relationships className="border-t border-line py-8">
      <h2 className="text-2xl leading-heading">{m.relationshipsTitle}</h2>
      <p className="mt-3 max-w-2xl text-base text-slate">{m.relationshipsIntro}</p>
      <div className="mt-6"><RelationshipCards locale={locale} /></div>
    </section>
    <section className="border-t border-line py-8"><h2 className="text-2xl leading-heading">{ui.stepsTitle}</h2><ol className="mt-6 grid gap-x-8 md:grid-cols-3">{ui.publicSteps.map((step, i) => <li key={step} className="flex gap-4 border-b border-line py-4 text-base md:flex-col md:gap-2 md:border-b-0 md:border-t md:pt-4"><span aria-hidden="true" className="text-xs text-warm-ink">0{i + 1}</span>{step}</li>)}</ol></section>
    <p className="mb-2 text-sm text-mist">{ui.noConsentYet}</p><p className="mb-8 text-xs text-mist">{m.note}</p>
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8"><PrimaryButton href={href(locale, "/quiz")} className="md:max-w-xs">{ui.start}</PrimaryButton><TextLink href={href(locale, "/my/report")} prefetch={false}>{ui.myReports}</TextLink></div>
  </main></>;
}
