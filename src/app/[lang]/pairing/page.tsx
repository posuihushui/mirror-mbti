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
import { Briefcase, Heart, HouseLine, Smiley } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { COMPARE_RELATIONSHIPS, type CompareRelationship } from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";

const relationshipIcons: Record<CompareRelationship, Icon> = { partner: Heart, friend: Smiley, family: HouseLine, colleague: Briefcase };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale(); const m = pairingMessages[locale];
  return pageMetadata({ locale, path: "/pairing", title: m.title, description: m.summary });
}
export default async function PairingPage() {
  const locale = await getLocale(); const m = pairingMessages[locale]; const ui = pairingUiMessages[locale]; const c = compareMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/")} path="/pairing" /><main className="mx-auto max-w-5xl px-6 pt-8 pb-16 md:pt-14">
    <section><PairingReveal><p className="eyebrow text-warm-ink">{ui.introEyebrow}</p><h1 className="mt-4 max-w-3xl text-3xl leading-heading md:text-5xl">{m.heading}</h1><p className="mt-5 max-w-2xl text-base text-slate">{m.summary}</p></PairingReveal></section>
    <div className="my-10 md:my-14"><PairingExample locale={locale} relationship="partner" /></div>
    {/* The feature's point: the same difference, written for each relationship. Scenes and topic titles only, never a reading. */}
    <section data-relationships className="border-t border-line py-8">
      <h2 className="text-2xl leading-heading">{m.relationshipsTitle}</h2>
      <p className="mt-3 max-w-2xl text-base text-slate">{m.relationshipsIntro}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{COMPARE_RELATIONSHIPS.map((relationship) => {
        const Glyph = relationshipIcons[relationship];
        return <li key={relationship} data-relationship={relationship} className="rounded-[4px] border border-line bg-card p-5">
          <p className="flex items-center gap-2 text-base font-medium"><Glyph size={22} weight="light" className="text-warm-ink" aria-hidden />{c.relationshipLabels[relationship]}</p>
          <p className="mt-3 border-l-2 border-warm pl-3 text-sm">{c.byRelationship[relationship].scenes.JP.opposite}</p>
          <p className="mt-4 text-xs text-mist">{c.topicLabels[relationship]}</p>
          <p className="mt-1 text-sm font-medium">{c.byRelationship[relationship].topic.title}</p>
        </li>;
      })}</ul>
    </section>
    <section className="border-t border-line py-8"><h2 className="text-2xl leading-heading">{ui.stepsTitle}</h2><ol className="mt-6 grid gap-x-8 md:grid-cols-3">{ui.publicSteps.map((step, i) => <li key={step} className="flex gap-4 border-b border-line py-4 text-base md:flex-col md:gap-2 md:border-b-0 md:border-t md:pt-4"><span aria-hidden="true" className="text-xs text-warm-ink">0{i + 1}</span>{step}</li>)}</ol></section>
    <p className="mb-2 text-sm text-mist">{ui.noConsentYet}</p><p className="mb-8 text-xs text-mist">{m.note}</p>
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8"><PrimaryButton href={href(locale, "/quiz")} className="md:max-w-xs">{ui.start}</PrimaryButton><TextLink href={href(locale, "/my/report")} prefetch={false}>{ui.myReports}</TextLink></div>
  </main></>;
}
