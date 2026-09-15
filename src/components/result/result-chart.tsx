import { Radar } from "@/components/result/radar";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, type Letter, type Profile } from "@/lib/personality";
import { dimensions } from "@/lib/questionnaires";

/** `.result-chart`: section label, radar, four-up percentages, note. */
export async function ResultChart({ profile }: { profile: Profile }) {
  const locale = await getLocale();
  const t = resultMessages[locale].chart;
  const poles = polesFor(locale);
  const letters = profile.type.split("");
  return (
    <div className="border-t border-line px-[27px] pt-[25px] pb-[35px] md:border-t-0 md:border-l md:pt-[15px] md:pr-0 md:pb-0 md:pl-[35px]">
      <div className="flex justify-between text-[10px] text-[#58676d] md:text-[11px]">
        <span>{t.heading}</span>
        <span className="text-[9px] text-[#8c999e]">01 — 04</span>
      </div>
      <Radar profile={profile} height={310} className="mt-[22px] mb-[10px]" />
      <div className="mt-5 grid grid-cols-4">
        {letters.map((l, i) => (
          <div key={l} className="flex flex-col gap-[6px] text-center not-first:border-l not-first:border-line">
            <span className="text-[11px] text-[#748187]">{profile.balanced[i] ? dimensions[i].split("").join(" / ") : poles[l as Letter].label}</span>
            <strong className="text-[22px] font-normal md:text-[25px]">
              {profile.values[i]}
              <small className="pl-[2px] text-[12px]">%</small>
            </strong>
          </div>
        ))}
      </div>
      <p className="mt-[23px] text-center text-[11px] leading-[1.9] text-mist">{t.note}</p>
    </div>
  );
}
