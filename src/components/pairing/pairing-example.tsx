import type { Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getPairingExample } from "@/lib/pairing-example";
import { ComparisonReading } from "@/components/compare/comparison-reading";
import { PairingReveal } from "./pairing-reveal";

/**
 * Always a preview: the emphasis and one dimension, never the four-card reading a pair receives.
 * One level of containers only: the two voices are quotes, the reading brings its own cards.
 */
export function PairingExample({ locale }: { locale: Locale }) {
  const m = pairingMessages[locale].example;
  const example = getPairingExample(locale);
  return <section data-pairing-example>
    <p className="eyebrow text-mist">{m.label}</p>
    <p className="mt-2 text-sm text-mist">{m.disclaimer}</p>
    <h3 className="mt-5 text-2xl leading-heading">{m.title}</h3>
    <PairingReveal stagger>
      <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-6">
        <blockquote className="border-l-2 border-warm pl-4"><p className="text-xs text-mist">{m.firstPerson}</p><p className="mt-1 text-base">{m.firstLine}</p></blockquote>
        <blockquote className="border-l-2 border-line pl-4"><p className="text-xs text-mist">{m.secondPerson}</p><p className="mt-1 text-base">{m.secondLine}</p></blockquote>
      </div>
    </PairingReveal>
    <div className="mt-6">
      <ComparisonReading content={example.content} locale={locale} compact animate={false}
        sides={{ you: example.host.categories, other: example.guest.categories, youLabel: m.firstPerson, otherLabel: m.secondPerson }} />
    </div>
  </section>;
}
