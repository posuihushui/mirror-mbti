import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

/** Marks the sample report as a sample, right above the reading, and offers the test. */
export function SampleNotice() {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-[27px] pt-5 pb-[18px] md:flex-row md:items-end md:justify-between md:gap-10 md:px-0 md:pt-0 md:pb-6">
      <div>
        <p className="eyebrow text-[8px] text-[#738087] md:text-[10px]">SAMPLE REPORT · 示例报告</p>
        <p className="mt-2 max-w-[560px] text-[12px] leading-[1.9] text-[#6b777d] md:text-[13px]">
          这是一份示例，用一次 INFJ 的作答生成，展示完整报告的样子。完成测试后，你会读到属于自己的那一份。
        </p>
      </div>
      <Link href="/quiz" className="text-link shrink-0 text-[12px] whitespace-nowrap">
        开始认识自己
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
