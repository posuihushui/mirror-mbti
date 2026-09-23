import { Badge } from "@/components/ui/badge";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { TypeName } from "@/components/result/type-name";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, profileMeta, type Letter, type Profile } from "@/lib/personality";
import { preferenceDimensionsFor } from "@/lib/preference-content";

/**
 * `.type-intro`: the result's reveal. The type's own line and summary lead; a near-balanced
 * dimension gets one named line here and its full reading further down the page.
 */
export async function TypeIntro({ profile, sample }: { profile: Profile; sample: boolean }) {
  const locale = await getLocale();
  const t = resultMessages[locale].typeIntro;
  const poles = polesFor(locale);
  const { name, line, summary, letters } = profileMeta(profile, locale);
  const leaning = letters.filter((_, i) => !profile.balanced[i]);
  const balancedPairs = preferenceDimensionsFor(locale).filter((_, i) => profile.balanced[i]).map((d) => d.pair);
  const note = !balancedPairs.length ? null : leaning.length ? t.balancedNote(balancedPairs) : t.allBalanced;
  return (
    <section className="relative bg-night px-6 py-8 text-paper md:p-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-warm">{sample ? t.sampleEyebrow : t.ownEyebrow}</p>
          <p className="mt-6 text-7xl leading-none font-medium tracking-tighter md:text-8xl">{profile.type}</p>
        </div>
        <MirrorMark profile={profile} tone="paper" size={120} className="size-22 shrink-0 md:size-30" />
      </div>
      <TypeName name={name} className="mt-3 block text-sm text-night-body md:text-base" />
      <h1 className="mt-8 max-w-lg text-3xl leading-heading md:text-4xl">{line}</h1>
      <p className="mt-5 max-w-md text-sm text-night-body md:text-base">{summary}</p>
      {leaning.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {leaning.map((l) => (
            <Badge key={l} className="border-night-line bg-white/5 text-paper">{t.badge(poles[l as Letter].label)}</Badge>
          ))}
        </div>
      )}
      {note && <p className="mt-5 max-w-md text-xs text-night-mist">{note}</p>}
    </section>
  );
}
