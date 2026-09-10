"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen } from "@phosphor-icons/react";
import { PrimaryButton } from "@/components/site/primary-button";

/** `.empty-report`: shown from "我的报告" before any test has been completed. */
export function EmptyReportContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="pt-[35px] text-center">
      <BookOpen size={44} weight="thin" className="mx-auto text-[#8ea0a8]" />
      <p className="mt-[22px] mb-8 text-[12px] leading-[2] text-[#829198] whitespace-pre-line">
        {"你还没有完成测试。\n从 32 个日常片段，认识真实的自己。"}
      </p>
      <PrimaryButton href="/quiz" onClick={onNavigate}>
        开始测试
      </PrimaryButton>
      <Link href="/result/sample" onClick={onNavigate} className="text-link mt-[15px]">
        先看看报告示例
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
