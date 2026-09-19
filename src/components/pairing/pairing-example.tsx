import type { Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getPairingExample } from "@/lib/pairing-example";
import { ComparisonReading } from "@/components/compare/comparison-reading";
import { PairingReveal } from "./pairing-reveal";

export function PairingExample({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const m = pairingMessages[locale].example;
  const example = getPairingExample(locale);
  return <section data-pairing-example className="border border-line p-5 md:p-7">
    <p className="eyebrow text-mist">{m.label}</p>
    <p className="mt-3 text-xs leading-[1.8] text-mist">{m.disclaimer}</p>
    <h3 className="mt-5 text-xl leading-[1.5]">{m.title}</h3>
    <PairingReveal stagger><div className="mt-5 border-l border-[#c49473] pl-4 text-sm leading-[1.8]"><p className="text-xs text-mist">{m.firstPerson}</p><p>{m.firstLine}</p></div><div className="mt-4 border-l border-line pl-4 text-sm leading-[1.8]"><p className="text-xs text-mist">{m.secondPerson}</p><p>{m.secondLine}</p></div></PairingReveal>
    <ComparisonReading content={example.content} locale={locale} compact={compact} animate={false} />
  </section>;
}
