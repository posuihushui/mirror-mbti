import { AppHeader } from "@/components/site/app-header";
import { Skeleton } from "@/components/site/skeleton";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

/** The history page's frame: its heading row, then one record card. */
export default async function MyReportLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].history.title} backHref={href(locale, "/")} path="/my/report" />
      <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-10 md:pt-14" aria-busy>
        <div className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-9 w-72 max-w-full" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-[50px] md:w-56" />
        </div>
        <div className="mt-8 border border-line bg-card px-6 py-6 md:mt-10 md:px-8 md:py-7">
          <Skeleton className="h-3 w-24" />
          <div className="mt-5 flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="size-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-4/5" />
          <div className="mt-6 grid grid-cols-4 gap-3 border-y border-line py-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </div>
      </main>
    </>
  );
}
