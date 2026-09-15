import { AppHeader } from "@/components/site/app-header";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

export default async function ReportLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].report.ownTitle} backHref={href(locale, "/")} />
      <main className="md:mx-auto md:max-w-[1100px] md:px-[30px] md:pt-10" aria-busy>
        <div className="min-h-[70vh] animate-pulse bg-night md:ml-[250px]" />
      </main>
    </>
  );
}
