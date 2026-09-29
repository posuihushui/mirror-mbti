import { Radar } from "@/components/result/radar";
import { InfoTip } from "@/components/site/info-tip";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, type Letter, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";

/** `.result-chart`: section label with how to read it (ⓘ), radar, four-up percentages with how clearly each leans. */
export async function ResultChart({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const t = resultMessages[locale].chart;
  const poles = polesFor(locale);
  const letters = profile.type.split("");
  return (
    <div className="bg-card p-6 md:p-8">
      <div className="flex items-center justify-between text-xs text-mist">
        <div className="flex items-center gap-2">
          <span>{t.heading}</span>
          <InfoTip id="percent-info" label={t.infoLabel} close={t.infoClose}>
            {t.info.map((line) => <p key={line}>{line}</p>)}
          </InfoTip>
        </div>
        <span aria-hidden>01 — 04</span>
      </div>
      <Radar profile={profile} height={300} className="mt-6 mb-3" />
      <div className="mt-6 grid grid-cols-4">
        {letters.map((l, i) => (
          <div key={l} className="flex flex-col items-center gap-1 px-1 text-center not-first:border-l not-first:border-line">
            <span className="text-xs text-mist">{poles[l as Letter].label} {l}</span>
            <strong className="text-2xl font-normal md:text-[26px]">
              {profile.values[i]}
              <small className="pl-0.5 text-xs">%</small>
            </strong>
            <span className={profile.balanced[i] ? "text-xs text-warm-ink" : "text-xs text-mist"}>{dimensionReading(profile, i, locale).degree}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
