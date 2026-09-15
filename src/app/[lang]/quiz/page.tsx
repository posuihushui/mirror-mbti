import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Quiz } from "@/components/quiz/quiz";
import { priceFen } from "@/lib/env";
import { formatPriceFen } from "@/lib/site";

export const metadata: Metadata = {
  title: "MBTI 测试体验 · 32 / 64 题可选",
  description: "选择 32 题轻量版或 64 题标准版，通过原创日常情境题了解四维人格偏好，免费查看概览，可暂停续答。非官方 MBTI 量表。",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <>
      <AppHeader variant="page" title="认识自己" backHref="/" active="quiz" />
      <Quiz priceLabel={formatPriceFen(priceFen())} />
    </>
  );
}
