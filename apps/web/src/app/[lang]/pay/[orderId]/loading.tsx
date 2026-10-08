import { AppHeader } from "@/components/site/app-header";
import { Skeleton } from "@/components/site/skeleton";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

/** The order card's frame: status first, then the order line and its action. */
export default async function PayLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].pay.title} backHref={href(locale, "/")} />
      <main className="mx-auto max-w-lg px-6 pt-6 pb-20 md:pt-14" aria-busy>
        <div className="border border-line bg-card px-6 py-7 md:px-8 md:py-8">
          <div className="flex items-start gap-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 pt-1.5">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="mt-6 h-14 w-full rounded-[50px]" />
        </div>
      </main>
    </>
  );
}
