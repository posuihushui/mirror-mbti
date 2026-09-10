import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Quiz } from "@/components/quiz/quiz";

export const metadata: Metadata = {
  title: "人格测试 · 32 道情境题",
  description: "回想最近一段时间的日常，回答 32 道原创情境题，约 5 分钟，免费查看 16 种人格倾向之一与四维偏好。",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <>
      <AppHeader variant="page" title="认识自己" backHref="/" active="quiz" />
      <Quiz />
    </>
  );
}
