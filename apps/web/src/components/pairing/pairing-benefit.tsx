import { TextLink } from "@/components/site/text-link";
import { href, type Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PairingReveal } from "./pairing-reveal";

/**
 * The guide for two, as something the report brings along. The full-width variant follows the result's
 * report offer and says what the guide gives and what both people unlock; `compact` is the report's
 * one-line strip. The fictional example lives on `/pairing`, which both link to.
 */
export function PairingBenefit({ locale, resultId, unlocked = false, compact = false }: { locale: Locale; resultId?: string; unlocked?: boolean; compact?: boolean }) {
  const m = pairingMessages[locale]; const ui = pairingUiMessages[locale];
  const invite = unlocked && resultId
    ? <TextLink prefetch={false} className="font-medium" href={href(locale, `/my/pairing?result=${encodeURIComponent(resultId)}`)}>{ui.invite}</TextLink>
    : null;
  if (compact) return <section data-pairing-benefit={unlocked ? "unlocked" : "preview"} className="my-4 flex flex-col gap-1 border-y border-line py-3 md:flex-row md:items-center md:justify-between md:gap-8">
    <p className="text-sm"><span className="font-medium">{unlocked ? ui.included : m.title}</span><span className="hidden text-mist md:inline"> · {ui.noConsentYet}</span></p>
    <div className="flex shrink-0 flex-wrap items-center gap-x-6">{invite}<TextLink className="text-mist hover:text-ink" href={href(locale, "/pairing")}>{ui.learn}</TextLink></div>
  </section>;
  return <section data-pairing-benefit={unlocked ? "unlocked" : "preview"} className="mx-6 my-10 border-t border-line pt-8 md:mx-0">
    <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
      <PairingReveal>
        <p className="eyebrow text-warm-ink">{unlocked ? ui.included : ui.benefit}</p>
        <h2 className="mt-3 text-2xl leading-heading">{unlocked ? m.title : m.heading}</h2>
        <p className="mt-3 max-w-2xl text-sm text-mist">{m.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm">{[...ui.outputs, ui.relationshipOutput].map(item => <li key={item} className="flex gap-3"><span aria-hidden className="text-warm">—</span>{item}</li>)}</ul>
      </PairingReveal>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 md:mt-0 md:flex-col md:items-end">{invite}<TextLink href={href(locale, "/pairing")}>{ui.learn}</TextLink></div>
    </div>
    <p className="mt-5 text-xs text-mist">{m.feeRule} {ui.noConsentYet}</p>
  </section>;
}
