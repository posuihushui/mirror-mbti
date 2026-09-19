import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { Quiz } from "@/components/quiz/quiz";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pageMessages[locale].quiz;
  return pageMetadata({ locale, title: t.metaTitle, description: t.metaDescription, path: "/quiz" });
}

export default async function QuizPage() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].quiz.headerTitle} backHref={href(locale, "/")} active="quiz" path="/quiz" />
      <Quiz />
    </>
  );
}
