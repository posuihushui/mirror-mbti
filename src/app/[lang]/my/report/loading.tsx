import { AppHeader } from "@/components/site/app-header";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

export default async function MyReportLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].history.title} backHref={href(locale, "/")} path="/my/report" />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 md:pt-[60px]" aria-busy>
        <div className="h-[44px] w-[260px] animate-pulse rounded bg-[#dfe6e8]" />
      </main>
    </>
  );
}
