import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { PrimaryButton } from "@/components/site/primary-button";
import { QUESTION_COUNT } from "@/lib/personality";

type Props = {
  priceLabel: string;
  /** Optional secondary link, e.g. from the sample result page into the sample report. */
  secondary?: { href: string; label: string };
};

/**
 * Closing block of the public sample. Everything here is already free to read, so the
 * invitation is to take the test — the price stays a footnote, not a headline.
 */
export function SampleCta({ priceLabel, secondary }: Props) {
  const meta: [string, string][] = [
    [String(QUESTION_COUNT), "道情境题"],
    ["5", "分钟左右"],
    ["16", "种人格倾向"],
  ];

  return (
    <section className="mx-4 block bg-night-deep px-[27px] py-8 text-[#eff3f4] md:mx-0 md:grid md:grid-cols-2 md:items-center md:gap-[45px] md:p-10 xl:gap-[90px] xl:px-[60px] xl:py-14">
      <div>
        <p className="eyebrow text-[9px] text-[#99a6a9]">YOUR TURN · 轮到你了</p>
        <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{"属于你的故事，\n还未开始。"}</h2>
        <p className="mt-[27px] text-[11px] leading-[2] text-[#a1afb2] md:text-[12px]">
          这是一份示例报告。回答 {QUESTION_COUNT} 道日常情境题，你会看到自己的四维偏好，和一份同样完整的报告。
        </p>
      </div>
      <div className="mt-[30px] md:mt-0">
        <div className="flex items-center gap-[13px] xl:gap-6">
          {meta.map(([value, label], i) => (
            <span
              key={label}
              className={
                "flex items-center gap-1 text-[14px] font-medium whitespace-nowrap md:gap-[5px] md:text-[20px]" +
                (i > 0 ? " border-l border-[#33403f] pl-[13px] xl:pl-6" : "")
              }
            >
              {value} <small className="text-[8px] font-normal text-[#9eacb0] md:text-[11px]">{label}</small>
            </span>
          ))}
        </div>
        <div className="mt-[30px] hidden md:block">
          <PrimaryButton href="/quiz" light>
            开始认识自己
          </PrimaryButton>
        </div>
        {secondary && (
          <Link href={secondary.href} className="text-link mt-[18px] text-[12px] text-[#d8e0e2]">
            {secondary.label}
            <ArrowUpRight size={15} />
          </Link>
        )}
        <p className="mt-[22px] text-[9px] leading-[1.9] text-[#86999f] md:mt-[15px] md:text-[10px]">
          免费测试与性格概览 · 完整报告 ¥{priceLabel} / 次 · 无订阅、无自动续费
        </p>
      </div>
    </section>
  );
}
