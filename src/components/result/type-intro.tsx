import { Badge } from "@/components/ui/badge";
import { SurfaceMark } from "@/components/brand/surface-mark";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, profileMeta, type Letter, type Profile } from "@/lib/personality";

/** `.type-intro`: eyebrow, giant type letters, tagline, summary, tags. */
export async function TypeIntro({ profile, sample }: { profile: Profile; sample: boolean }) {
  const locale = await getLocale();
  const t = resultMessages[locale].typeIntro;
  const poles = polesFor(locale);
  const { name, line, summary, letters } = profileMeta(profile, locale);
  const leaning = letters.filter((_, i) => !profile.balanced[i]);
  return (
    <section className="surface-texture surface-texture-dark relative overflow-hidden bg-night px-6 py-8 text-paper md:p-10">
      <SurfaceMark className="-right-24 -bottom-20" />
      <div className="surface-content">
        <p className="eyebrow text-warm">{sample ? t.sampleEyebrow : t.ownEyebrow}</p>
        <div className="my-6 flex items-baseline gap-4 text-7xl leading-none font-medium tracking-[-0.055em] md:text-8xl">
          {profile.type}
          <span className="text-sm font-normal tracking-wider text-[#cbd5d8] md:text-base">{name}</span>
        </div>
        <h1 className="max-w-lg text-3xl leading-normal tracking-[-0.035em] md:text-4xl">{line}</h1>
        <p className="mt-6 max-w-md text-sm leading-8 text-[#acb9bd]">{summary}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {leaning.map((l) => (
            <Badge key={l} className="border-night-line bg-white/5 text-[#dbe3e5]">{t.badge(poles[l as Letter].label)}</Badge>
          ))}
        </div>
        {profile.balanced.some(Boolean) && (
          <p className="mt-5 text-xs leading-7 text-[#9eacb0]">{leaning.length ? t.partialBalanced : t.allBalanced}</p>
        )}
      </div>
    </section>
  );
}
