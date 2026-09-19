import Link from "next/link";
import { href, type Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PairingExample } from "./pairing-example";
import { PairingReveal } from "./pairing-reveal";

export function PairingBenefit({ locale, resultId, unlocked = false, compact = false, dark = false }: { locale: Locale; resultId?: string; unlocked?: boolean; compact?: boolean; dark?: boolean }) {
  const m = pairingMessages[locale]; const ui = pairingUiMessages[locale];
  return <section data-pairing-benefit={unlocked ? "unlocked" : "preview"} className={`${dark ? "border-[#59676c] text-paper" : "border-line"} border p-5 md:p-7 ${compact ? "my-6" : "mx-6 my-7 md:mx-0 md:my-10"}`}>
    <div className={!compact && !unlocked ? "grid gap-5 md:grid-cols-2 md:gap-7" : ""}>
      <div>
        <PairingReveal><p className="eyebrow text-mist">{unlocked ? ui.included : ui.benefit}</p><h2 className={`${compact ? "text-xl" : "text-[27px] md:text-[30px]"} mt-4 leading-[1.5]`}>{unlocked ? m.title : m.heading}</h2><p className="mt-4 text-sm leading-[1.8]">{m.summary}</p>{!compact && <ul className="mt-5 space-y-2 text-sm leading-[1.8]">{ui.outputs.map(item => <li key={item}>— {item}</li>)}</ul>}</PairingReveal>
        <p className="mt-5 text-xs leading-[1.9] text-mist">{m.feeRule}</p>
        <p className="mt-3 text-xs leading-[1.9] text-mist">{ui.noConsentYet}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {unlocked && resultId && <Link prefetch={false} className={`pill min-h-11 ${dark ? "bg-paper text-ink hover:bg-paper" : ""}`} href={href(locale, `/my/pairing?result=${encodeURIComponent(resultId)}`)}>{ui.invite}</Link>}
          <Link className="text-link min-h-11 text-sm" href={href(locale, "/pairing")}>{ui.learn}</Link>
        </div>
      </div>
      {!compact && !unlocked && <PairingExample locale={locale} compact />}
    </div>
  </section>;
}
