import { Radar } from "@/components/result/radar";
import { poles, type Profile } from "@/lib/personality";

/** `.result-chart`: section label, radar, four-up percentages, note. */
export function ResultChart({ profile }: { profile: Profile }) {
  const letters = profile.type.split("");
  return (
    <div className="border-t border-line px-[27px] pt-[25px] pb-[35px] md:border-t-0 md:border-l md:pt-[15px] md:pr-0 md:pb-0 md:pl-[35px]">
      <div className="flex justify-between text-[10px] text-[#58676d] md:text-[11px]">
        <span>四个维度，认识你的偏好</span>
        <span className="text-[9px] text-[#8c999e]">01 — 04</span>
      </div>
      <Radar profile={profile} height={310} className="mt-[22px] mb-[10px]" />
      <div className="mt-5 grid grid-cols-4">
        {letters.map((l, i) => (
          <div key={l} className="flex flex-col gap-[6px] text-center not-first:border-l not-first:border-line">
            <span className="text-[10px] text-[#748187]">{poles[l].label}</span>
            <strong className="text-[22px] font-normal md:text-[25px]">
              {profile.values[i]}
              <small className="pl-[2px] text-[12px]">%</small>
            </strong>
          </div>
        ))}
      </div>
      <p className="mt-[23px] text-center text-[8px] text-[#7f8e94] md:text-[9px]">百分比表示本次作答的偏好强度，无优劣之分。</p>
    </div>
  );
}
