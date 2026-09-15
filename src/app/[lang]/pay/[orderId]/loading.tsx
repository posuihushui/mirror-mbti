import { AppHeader } from "@/components/site/app-header";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

export default async function PayLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].pay.title} backHref={href(locale, "/")} />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 md:pt-[60px]" aria-busy>
        <div className="h-[15px] w-[80px] animate-pulse rounded bg-[#dfe6e8]" />
        <div className="mt-5 h-[44px] w-[260px] animate-pulse rounded bg-[#dfe6e8]" />
      </main>
    </>
  );
}
