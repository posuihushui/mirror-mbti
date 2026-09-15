import { Badge } from "@/components/ui/badge";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { hasClearPreference, polesFor, profileMeta, type Letter, type Profile } from "@/lib/personality";

/** `.type-intro`: eyebrow, giant type letters, tagline, summary, tags. */
export async function TypeIntro({ profile, sample }: { profile: Profile; sample: boolean }) {
  const locale = await getLocale();
  const t = resultMessages[locale].typeIntro;
  const poles = polesFor(locale);
  const { name, line, summary, letters } = profileMeta(profile, locale);
  const clear = hasClearPreference(profile);
  return (
    <div className="px-[27px] pt-[17px] pb-[35px] md:p-0">
      <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">{sample ? t.sampleEyebrow : t.ownEyebrow}</p>
      <div className="my-6 flex items-baseline gap-[17px] text-[79px] leading-[1.15] font-medium tracking-[-0.055em] md:mt-6 md:mb-[22px] md:gap-[22px] md:text-[102px]">
        {clear ? profile.type : "—"}
        <span className="text-[14px] font-normal tracking-[0.08em] md:text-[16px]">{name}</span>
      </div>
      <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{line}</h1>
      <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">{summary}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {letters.filter((_, i) => !profile.balanced[i]).map((l) => (
          <Badge key={l}>{t.badge(poles[l as Letter].label)}</Badge>
        ))}
      </div>
      {profile.balanced.some(Boolean) && (
        <p className="mt-[18px] text-[12px] leading-[1.8] text-mist">{clear ? t.partialBalanced : t.unclearNote}</p>
      )}
    </div>
  );
}
