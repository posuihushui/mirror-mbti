import { TextLink } from "@/components/site/text-link";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { dimensions, polesFor, type Letter, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";

/**
 * A two-ended scale: where this set of answers fell between the pair. The ends are the letters,
 * the centre is marked, and the side the answers leaned to is set in ink.
 */
function PolarityBar({ dimension, firstPercent, degree, balanced }: { dimension: string; firstPercent: number; degree: string; balanced: boolean }) {
  const [first, second] = dimension.split("");
  const secondPercent = 100 - firstPercent;
  const leanFirst = firstPercent > secondPercent;
  const from = Math.min(50, secondPercent);
  const to = Math.max(50, secondPercent);
  return (
    <div className="mt-4" aria-hidden>
      <div className="flex justify-between text-xs">
        <span className={leanFirst ? "font-medium text-ink" : "text-mist"}>{first} {firstPercent}%</span>
        <span className={balanced ? "text-warm-ink" : "text-mist"}>{degree}</span>
        <span className={!leanFirst ? "font-medium text-ink" : "text-mist"}>{second} {secondPercent}%</span>
      </div>
      <div className="relative mt-2 h-2">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <span className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[#b9c5c9]" />
        <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-warm" style={{ left: `${from}%`, width: `${to - from}%` }} />
        <span className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm" style={{ left: `${secondPercent}%` }} />
      </div>
    </div>
  );
}

export async function PreferenceReading({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const t = resultMessages[locale].reading;
  const readings = dimensions.map((_, i) => dimensionReading(profile, i, locale));
  const focus = profile.balanced.findIndex(Boolean);
  const practice = focus >= 0 ? readings[focus].question : polesFor(locale)[profile.type[0] as Letter].growth;
  return (
    <section className="mx-6 mb-10 md:mx-0" aria-labelledby="preference-reading">
      <h2 id="preference-reading" className="text-2xl leading-heading">{t.heading}</h2>
      <p className="mt-3 max-w-2xl text-sm text-mist">{t.lede}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {readings.map((r, i) => (
          <section key={r.dimension} className="bg-card p-5 md:p-6" aria-label={`${r.title} · ${r.pair}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-medium">{r.title}</h3>
              <span className="text-xs text-mist">{r.pair}</span>
            </div>
            <PolarityBar dimension={r.dimension} firstPercent={r.firstPercent} degree={r.degree} balanced={profile.balanced[i]} />
            <p className="sr-only">{r.dimension[0]} {r.firstPercent}% / {r.dimension[1]} {r.secondPercent}% · {r.degree}</p>
            <p className="mt-4 text-sm text-ink">{r.interpretation}</p>
            <p className="mt-2 text-sm text-mist">{r.description}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 border-l-2 border-warm py-1 pl-4 md:pl-5">
        <p className="eyebrow text-warm-ink">{t.practice}</p>
        <p className="mt-2 text-base">{practice}</p>
      </div>
      <p className="mt-6 max-w-2xl text-xs text-mist">{t.note}</p>
      <TextLink href={href(locale, "/preferences")} className="mt-2">{t.link}</TextLink>
    </section>
  );
}
