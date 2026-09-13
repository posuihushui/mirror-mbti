import Link from "next/link";
import { dimensions, poles, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";

export function PreferenceReading({ profile }: { profile: Profile }) {
  const readings = dimensions.map((_, i) => dimensionReading(profile, i));
  const focus = profile.balanced.findIndex(Boolean);
  const practice = focus >= 0 ? readings[focus].question : poles[profile.type[0]].growth;
  return (
    <section className="mx-[27px] mb-9 border-t border-line pt-7 md:mx-0 md:pt-9" aria-labelledby="preference-reading">
      <h2 id="preference-reading" className="text-[22px] leading-[1.6]">比四个字母，更值得留意的事。</h2>
      <div className="mt-6 grid gap-x-8 md:grid-cols-2">
        {readings.map((r) => <section key={r.dimension} className="border-b border-line py-5">
          <h3 className="text-[14px]">{r.title} · {r.pair}</h3>
          <p className="mt-2 text-[12px] text-ink">{r.dimension[0]} {r.firstPercent}% / {r.dimension[1]} {r.secondPercent}% · {r.degree}</p>
          <p className="mt-3 text-[13px] leading-[2] text-mist">{r.interpretation}</p>
          <p className="mt-3 text-[12px] leading-[2] text-mist">{r.description}</p>
        </section>)}
      </div>
      <p className="mt-6 text-[13px] leading-[2]"><strong className="font-medium">今天的小练习：</strong>{practice}</p>
      <p className="mt-4 text-[12px] leading-[2] text-mist">百分比只是本问卷的作答位置，不是能力分、准确率或人群百分位。复测时先比较具体情境与维度变化；不同版本的分数不直接视为等价。</p>
      <Link href="/preferences" className="text-link mt-4 min-h-11">了解四维偏好与复测</Link>
    </section>
  );
}
