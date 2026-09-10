import { Badge } from "@/components/ui/badge";
import { poles, typeMeta, type Profile } from "@/lib/personality";

/** `.type-intro`: eyebrow, giant type letters, tagline, summary, tags. */
export function TypeIntro({ profile, sample }: { profile: Profile; sample: boolean }) {
  const { name, line, summary, letters } = typeMeta(profile.type);
  return (
    <div className="px-[27px] pt-[17px] pb-[35px] md:p-0">
      <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">{sample ? "SAMPLE REPORT · 示例报告" : "YOUR PERSONALITY · 你的性格画像"}</p>
      <div className="my-6 flex items-baseline gap-[17px] text-[79px] leading-[1.15] font-medium tracking-[-0.055em] md:mt-6 md:mb-[22px] md:gap-[22px] md:text-[102px]">
        {profile.type}
        <span className="text-[14px] font-normal tracking-[0.08em] md:text-[16px]">{name}</span>
      </div>
      <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{line}</h1>
      <p className="mt-[23px] max-w-[410px] text-[13px] leading-[1.9] text-[#6b777d]">{summary}</p>
      <div className="mt-6 flex gap-2">
        {letters.slice(0, 3).map((l) => (
          <Badge key={l}>{poles[l].label}倾向</Badge>
        ))}
      </div>
      {profile.balanced.some(Boolean) && (
        <p className="mt-[18px] text-[10px] leading-[1.8] text-[#819097]">部分维度接近均衡，字母只描述这次作答中的倾向。</p>
      )}
    </div>
  );
}
