import Link from "next/link";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { dimensions, polesFor, type Letter, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";

export async function PreferenceReading({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const t = resultMessages[locale].reading;
  const readings = dimensions.map((_, i) => dimensionReading(profile, i, locale));
  const focus = profile.balanced.findIndex(Boolean);
  const practice = focus >= 0 ? readings[focus].question : polesFor(locale)[profile.type[0] as Letter].growth;
  return (
    <section className="mx-6 mb-10 border-t border-line pt-8 md:mx-0 md:pt-10" aria-labelledby="preference-reading">
      <h2 id="preference-reading" className="text-[22px] leading-[1.6]">{t.heading}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {readings.map((r) => <section key={r.dimension} className="bg-card p-5 md:p-6">
          <h3 className="text-[14px]">{r.title} · {r.pair}</h3>
          <p className="mt-2 text-[12px] text-ink">{r.dimension[0]} {r.firstPercent}% / {r.dimension[1]} {r.secondPercent}% · {r.degree}</p>
          <p className="mt-3 text-[13px] leading-[2] text-mist">{r.interpretation}</p>
          <p className="mt-3 text-[12px] leading-[2] text-mist">{r.description}</p>
        </section>)}
      </div>
      <p className="warm-panel mt-6 p-5 text-[13px] leading-[2] md:p-6"><strong className="font-medium">{t.practice}</strong>{practice}</p>
      <p className="mt-4 text-[12px] leading-[2] text-mist">{t.note}</p>
      <Link href={href(locale, "/preferences")} className="text-link mt-4 min-h-11">{t.link}</Link>
    </section>
  );
}
